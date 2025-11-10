import { useControls } from "leva";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";

import {
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
} from "@react-three/drei";
import Building from "./Building";

const BuildingScene = () => {
  const [globalClickedPoint, setGlobalClickedPoint] =
    useState<THREE.Vector3 | null>(null);
  const [buildingClickedPoint, setBuildingClickedPoint] =
    useState<THREE.Vector3 | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [zoomTarget, setZoomTarget] = useState<{
    position: [number, number, number];
    feature: string;
  } | null>(null);

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Leva color controls
  const { buildingColor, doorColor, roofColor, windowColor } = useControls({
    buildingColor: { value: "#b0b0b0", label: "Building" },
    doorColor: { value: "#654321", label: "Door" },
    roofColor: { value: "#888", label: "Roof" },
    windowColor: { value: "#87ceeb", label: "Windows" },
  });

  // Animate camera zoom on feature click
  useEffect(() => {
    if (!zoomTarget || !cameraRef.current) return;
    const camera = cameraRef.current;
    const targetPos = zoomTarget.position;
    // Animate camera position towards target
    let frame = 0;
    const start = camera.position.clone();
    const end = new THREE.Vector3(...targetPos).add(
      new THREE.Vector3(0, 1.5, 2)
    );
    const animate = () => {
      frame++;
      const t = Math.min(frame / 30, 1);
      camera.position.lerpVectors(start, end, t);
      camera.lookAt(...targetPos);
      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [zoomTarget]);

  return (
    <div
      style={{
        position: "relative",
        width: "calc(100vw - 200px)",
        height: "calc(100vh - 200px)",
      }}
    >
      <Canvas
        shadows
        camera={{ position: [5, 5, 10], fov: 50 }}
        style={{
          width: "100%",
          height: "100%",
          background: "#f4f7fa",
          borderRadius: "16px",
        }}
        onCreated={({ camera, gl }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
          rendererRef.current = gl;
        }}
        onPointerDown={(event) => {
          if (!cameraRef.current || !rendererRef.current) return;
          const renderer = rendererRef.current;
          const rect = renderer.domElement.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const point = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, point);
          setGlobalClickedPoint(point.clone());
        }}
      >
        <axesHelper args={[5]} />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />
        <pointLight intensity={40} position={[3, 2, 3]} />
        {/* Building with feature hover/click handlers */}
        <Building
          onPointerDown={(event: ThreeEvent<PointerEvent>) => {
            if (event.point) {
              const point = event.point;
              setBuildingClickedPoint(point.clone());
            }
          }}
          buildingColor={buildingColor}
          doorColor={doorColor}
          roofColor={roofColor}
          windowColor={windowColor}
          onFeatureHover={setHoveredFeature}
          onFeatureClick={(
            feature: string,
            position: [number, number, number]
          ) => {
            setZoomTarget({ feature, position });
          }}
          hoveredFeature={hoveredFeature}
        />
        <gridHelper args={[20, 20]} />
        {/* Show global coordinate marker (blue dot) */}
        {globalClickedPoint && (
          <mesh
            position={[
              globalClickedPoint.x,
              globalClickedPoint.y + 0.1,
              globalClickedPoint.z,
            ]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#0066ff" />
          </mesh>
        )}
        {/* Show building coordinate marker (red dot) */}
        {buildingClickedPoint && (
          <mesh
            position={[
              buildingClickedPoint.x,
              buildingClickedPoint.y + 0.1,
              buildingClickedPoint.z,
            ]}
          >
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        )}
        <OrbitControls />
      </Canvas>
      {/* Fixed position for coordinates display */}
      {(globalClickedPoint || buildingClickedPoint) && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            background: "#fff",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "14px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            border: "1px solid #ddd",
            zIndex: 10,
            minWidth: "250px",
          }}
        >
          {globalClickedPoint && (
            <div style={{ marginBottom: "6px" }}>
              <span style={{ fontWeight: "bold", color: "#0066ff" }}>
                Global Point:
              </span>
              <span style={{ marginLeft: 8 }}>
                ({globalClickedPoint.x.toFixed(2)},{" "}
                {globalClickedPoint.y.toFixed(2)},{" "}
                {globalClickedPoint.z.toFixed(2)})
              </span>
            </div>
          )}
          {buildingClickedPoint && (
            <div>
              <span style={{ fontWeight: "bold", color: "#ff0000" }}>
                Building Point:
              </span>
              <span style={{ marginLeft: 8 }}>
                ({buildingClickedPoint.x.toFixed(2)},{" "}
                {buildingClickedPoint.y.toFixed(2)},{" "}
                {buildingClickedPoint.z.toFixed(2)})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildingScene;
