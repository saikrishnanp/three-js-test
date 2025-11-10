import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

type Mode = "idle" | "picking" | "animating";
type SpaceMode = "2d" | "3d"; // NEW: spline creation mode

export const RobotSplineSimulator: React.FC = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [spaceMode, setSpaceMode] = useState<SpaceMode>("3d");
  const [points, setPoints] = useState<THREE.Vector3[]>([]);
  const [splineCurve, setSplineCurve] = useState<THREE.CatmullRomCurve3 | null>(null);
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (points.length > 1) {
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.1);
      setSplineCurve(curve);
    } else {
      setSplineCurve(null);
    }
  }, [points]);

  const handleMoveClick = () => {
    console.log({splineCurve})
    if (splineCurve) {
      setMode("animating");
      setStartAnimation(true);
    }
  };

  const handleAnimationComplete = () => {
    setPoints([]);
    setSplineCurve(null);
    setMode("idle");
    setStartAnimation(false);
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Canvas>
        <Scene
          mode={mode}
          spaceMode={spaceMode}
          splineCurve={splineCurve}
          points={points}
          setPoints={setPoints}
          startAnimation={startAnimation}
          onAnimationComplete={handleAnimationComplete}
        />
      </Canvas>

      {/* --- UI CONTROLS --- */}
      <div
        style={{
          position: "fixed",
          top: 55,
          left: 20,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {/* Toggle Picking */}
        <button
          onClick={() =>
            setMode((prev) => (prev === "picking" ? "idle" : "picking"))
          }
          style={{
            background: mode === "picking" ? "#2ecc71" : "#555",
            color: "white",
            padding: "6px 10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {mode === "picking" ? "Stop Picking" : "Start Picking"}
        </button>

        {/* Toggle 2D / 3D */}
        <button
          onClick={() =>
            setSpaceMode((prev) => (prev === "2d" ? "3d" : "2d"))
          }
          style={{
            background: spaceMode === "2d" ? "#f39c12" : "#2980b9",
            color: "white",
            padding: "6px 10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {spaceMode === "2d" ? "Switch to 3D Mode" : "Switch to 2D Mode"}
        </button>

        {/* Move */}
        <button
          onClick={handleMoveClick}
          disabled={!splineCurve}
          style={{
            background: splineCurve ? "#3498db" : "#777",
            color: "white",
            padding: "6px 10px",
            border: "none",
            borderRadius: "6px",
            cursor: splineCurve ? "pointer" : "not-allowed",
          }}
        >
          Move Object
        </button>

        {/* Clear */}
        {points.length > 0 && mode !== "animating" && (
          <button
            onClick={() => setPoints([])}
            style={{
              background: "#e74c3c",
              color: "white",
              padding: "6px 10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Clear Trajectory
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- 3D Scene ----------
interface SceneProps {
  mode: Mode;
  spaceMode: SpaceMode;
  splineCurve: THREE.CatmullRomCurve3 | null;
  points: THREE.Vector3[];
  setPoints: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
  startAnimation: boolean;
  onAnimationComplete: () => void;
}

const Scene: React.FC<SceneProps> = ({
  mode,
  spaceMode,
  splineCurve,
  points,
  setPoints,
  startAnimation,
  onAnimationComplete,
}) => {
  const planeRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const handleCanvasClick = (event: THREE.Event) => {
    if (mode !== "picking") return;

    const mouseEvent = event as unknown as MouseEvent;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(
      (mouseEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
      -(mouseEvent.offsetY / gl.domElement.clientHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouse, camera);

    if (spaceMode === "2d" && planeRef.current) {
      // 2D mode: intersect with ground plane
      const intersects = raycaster.intersectObject(planeRef.current);
      if (intersects.length > 0) {
        const point = intersects[0].point.clone();
        setPoints((prev) => [...prev, point]);
      }
    } else {
      // 3D mode: project into 3D space
      const depthDistance = 3; // depth from camera
      const direction = raycaster.ray.direction.clone().normalize();
      const origin = raycaster.ray.origin.clone();
      const point = origin.add(direction.multiplyScalar(depthDistance));
      setPoints((prev) => [...prev, point]);
    }
  };

  return (
    <group onClick={handleCanvasClick}>
      <color attach="background" args={["#0f0f0f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <PerspectiveCamera makeDefault position={[3, 3, 3]} />
      <OrbitControls />

      {/* Subtle axes for both modes */}
      <axesHelper args={[1.5]} />
      <gridHelper args={[10, 10, "#333", "#222"]} position={[0, -0.001, 0]} />

      {/* Plane visible only in 2D mode */}
      {spaceMode === "2d" && (
        <mesh
          ref={planeRef}
          rotation-x={-Math.PI / 2}
          position={[0, 0, 0]}
          name="groundPlane"
        >
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#222" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Cylinder Object */}
      <MovableCylinder
        spline={splineCurve}
        startAnimation={startAnimation}
        onComplete={onAnimationComplete}
      />

      {/* Control Points */}
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      ))}

      {/* Spline Path */}
      {splineCurve && (
        <Line
          points={splineCurve.getPoints(100)}
          color="cyan"
          lineWidth={2}
        />
      )}
    </group>
  );
};

// ---------- Cylinder That Moves Along the Spline ----------
interface MovableCylinderProps {
  spline: THREE.CatmullRomCurve3 | null;
  startAnimation: boolean;
  onComplete: () => void;
}

const MovableCylinder: React.FC<MovableCylinderProps> = ({
  spline,
  startAnimation,
  onComplete,
}) => {
  const ref = useRef<THREE.Mesh>(null);
  const [t, setT] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (startAnimation && spline) {
      setAnimating(true);
      setT(0);
    }
  }, [startAnimation, spline]);

  useFrame((_, delta) => {
    if (!animating || !spline || !ref.current) return;

    const speed = 0.2;
    const nextT = t + delta * speed;

    if (nextT >= 1) {
      setAnimating(false);
      setT(1);
      onComplete();
      return;
    }

    const pos = spline.getPoint(nextT);
    const tangent = spline.getTangent(nextT).normalize();

    ref.current.position.copy(pos);

    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
    ref.current.quaternion.copy(quaternion);

    setT(nextT);
  });

  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.05, 0.05, 0.3, 32]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
};

export default RobotSplineSimulator;