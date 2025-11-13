import { v4 as uuidv4 } from "uuid";
import React, { useState, useRef, useEffect } from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls, Line, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

type Mode = "idle" | "picking" | "animating" | "editing";
type SpaceMode = "2d" | "3d";
type PointData = { id: string; position: THREE.Vector3 };

export const RobotSplineSimulator: React.FC = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [spaceMode, setSpaceMode] = useState<SpaceMode>("3d");
  const [points, setPoints] = useState<PointData[]>([]);
  const [splineCurve, setSplineCurve] = useState<THREE.CatmullRomCurve3 | null>(
    null
  );
  const [startAnimation, setStartAnimation] = useState(false);

  useEffect(() => {
    if (points.length > 1) {
      const curve = new THREE.CatmullRomCurve3(
        points.map((p) => p.position.clone()),
        false,
        "catmullrom",
        0.1
      );
      setSplineCurve(curve);
    } else setSplineCurve(null);
  }, [points]);

  const handleMoveClick = () => {
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
    <div style={{ height: "calc(100vh - 50px)", width: "calc(100vw - 20px)" }}>
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

      {/* --- UI Controls --- */}
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
        {/* Start / Stop Picking */}
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

        {/* Edit (Delete) Mode */}
        {points.length > 0 && (
          <button
            onClick={() =>
              setMode((prev) => (prev === "editing" ? "idle" : "editing"))
            }
            style={{
              background: mode === "editing" ? "#e67e22" : "#555",
              color: "white",
              padding: "6px 10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {mode === "editing" ? "Stop Editing" : "Edit Picking"}
          </button>
        )}

        {/* 2D/3D toggle */}
        <button
          onClick={() => setSpaceMode((prev) => (prev === "2d" ? "3d" : "2d"))}
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

        {/* Move / Animate */}
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
  points: PointData[];
  setPoints: React.Dispatch<React.SetStateAction<PointData[]>>;
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Handle adding points
  const handleAddPoint = (e: ThreeEvent<MouseEvent>) => {
    if (mode !== "picking") return;
    e.stopPropagation();

    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    if (spaceMode === "2d" && planeRef.current) {
      const hits = raycaster.intersectObject(planeRef.current);
      if (hits.length > 0) {
        const hit = hits[0].point.clone();
        setPoints((prev) => [...prev, { id: uuidv4(), position: hit }]);
      }
    } else if (spaceMode === "3d") {
      const dist = 3;
      const dir = raycaster.ray.direction.clone().normalize();
      const pos = raycaster.ray.origin.clone().add(dir.multiplyScalar(dist));
      setPoints((prev) => [...prev, { id: uuidv4(), position: pos }]);
    }
  };

  return (
    <group onClick={handleAddPoint}>
      <color attach="background" args={["#0f0f0f"]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <PerspectiveCamera makeDefault position={[3, 3, 3]} />
      <OrbitControls />
      <axesHelper args={[1.5]} />
      <gridHelper args={[10, 10, "#333", "#222"]} position={[0, -0.001, 0]} />

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

      {/* Movable cylinder following spline */}
      <MovableCylinder
        spline={splineCurve}
        startAnimation={startAnimation}
        onComplete={onAnimationComplete}
      />

      {/* Control Points */}
      {points.map((p) => (
        <mesh
          key={p.id}
          position={p.position}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoveredId(p.id);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHoveredId((prev) => (prev === p.id ? null : prev));
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (mode === "editing") {
              // delete mode
              setPoints((prev) => prev.filter((pt) => pt.id !== p.id));
            }
          }}
        >
          <sphereGeometry args={[0.07]} />
          <meshStandardMaterial
            color={
              hoveredId === p.id
                ? mode === "editing"
                  ? "#ff4444"
                  : "#ff9900"
                : "orange"
            }
          />
        </mesh>
      ))}

      {/* Draw Spline */}
      {splineCurve && (
        <Line points={splineCurve.getPoints(100)} color="cyan" lineWidth={2} />
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
