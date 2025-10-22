import { useControls } from "leva";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";

import { GizmoHelper, GizmoViewport, Html, OrbitControls } from "@react-three/drei";
import Building from "./Building";

const BuildingScene = () => {
  const [clickedPoint, setClickedPoint] = useState<THREE.Vector3 | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [zoomTarget, setZoomTarget] = useState<{
    position: [number, number, number];
    feature: string;
  } | null>(null);

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
      const t = Math.min(frame / 30, 1);  // 30 frames animation
      camera.position.lerpVectors(start, end, t); // Linear interpolation ***
      camera.lookAt(...targetPos); // Always look at the target
      if (t < 1) requestAnimationFrame(animate); // Continue animation
    };
    animate();
  }, [zoomTarget]);

  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

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
          const raycaster = new THREE.Raycaster(); // Create a raycaster
          raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current); // Set ray from camera and mouse
          // Intersect with ground plane (y=0)
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const point = new THREE.Vector3();
          raycaster.ray.intersectPlane(plane, point);
          setClickedPoint(point.clone());
          console.log(
            `Clicked at: (${point.x.toFixed(2)}, ${point.y.toFixed(
              2
            )}, ${point.z.toFixed(2)})`
          );
        }}
      >
        <axesHelper args={[5]}/>
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
              setClickedPoint(point.clone());
              console.log(
                `Clicked at: (${point.x.toFixed(2)}, ${point.y.toFixed(
                  2
                )}, ${point.z.toFixed(2)})`
              );
            }
          }}
          buildingColor={buildingColor}
          doorColor={doorColor}
          roofColor={roofColor}
          windowColor={windowColor}
          onFeatureHover={setHoveredFeature}
          onFeatureClick={(feature: string, position: [number, number, number]) => {
            setZoomTarget({ feature, position });
          }}
          hoveredFeature={hoveredFeature}
        />
        <gridHelper args={[20, 20]} />
        {/* Show marker and label if a point is clicked */}
        {clickedPoint && (
          <>
            <mesh // Marker at clicked point
              position={[clickedPoint.x, clickedPoint.y + 0.1, clickedPoint.z]}
            >
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshStandardMaterial color="#ff6600" />
            </mesh>
            {/* Simple label using Html from drei */}
            <group
              position={[clickedPoint.x, clickedPoint.y + 0.25, clickedPoint.z]}
            >
              <Html // Label for clicked point
                center
                style={{
                  background: "#fff",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  border: "1px solid #ccc",
                }}
              >
                {`(${clickedPoint.x.toFixed(2)}, ${clickedPoint.y.toFixed(
                  2
                )}, ${clickedPoint.z.toFixed(2)})`}
              </Html>
            </group>
          </>
        )}
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default BuildingScene;
