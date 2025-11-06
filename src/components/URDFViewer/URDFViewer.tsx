import { useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls as DreiOrbitControls,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import URDFLoader from "urdf-loader";

import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

import InteractiveRobot from "./InteractiveRobot";

// available URDF files
const URDF_FILE_OPTIONS = [
  "/URDFs/T12/urdf/T12.URDF",
  "/URDFs/TriATHLETE/urdf/TriATHLETE.URDF",
];

const URDFViewer = () => {
  const [robot, setRobot] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedURDFPath, setSelectedURDFPath] = useState(
    URDF_FILE_OPTIONS[0]
  );

  useEffect(() => {
    const loader = new URDFLoader();
    loader.packages = "/URDFs";

    // Optional code to support STL and OBJ meshes
    loader.loadMeshCb = (path, manager, onComplete) => {
      const ext = path.split(".").pop()?.toLowerCase();
      if (ext === "stl") {
        new STLLoader(manager).load(
          path,
          (geom: THREE.BufferGeometry) => {
            const mesh = new THREE.Mesh(
              geom,
              new THREE.MeshStandardMaterial({ color: 0xcccccc })
            );
            onComplete(mesh);
          },
          undefined,
          () => onComplete(new THREE.Object3D())
        );
      } else if (ext === "obj") {
        new OBJLoader(manager).load(
          path,
          (obj: THREE.Group) => onComplete(obj),
          undefined,
          () => onComplete(new THREE.Object3D())
        );
      } else onComplete(new THREE.Object3D());
    };

    loader.load(
      selectedURDFPath,
      (urdf) => {
        urdf.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              metalness: 0.5,
              roughness: 0.5,
            });
          }
        });

        const box = new THREE.Box3().setFromObject(urdf);
        const center = box.getCenter(new THREE.Vector3());
        urdf.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        urdf.scale.setScalar(1 / maxAxis);

        setRobot(urdf);
      },
      undefined,
      () => setError("Failed to load URDF")
    );
  }, [selectedURDFPath]);

  const urdfChangeHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = URDF_FILE_OPTIONS.find((o) => o === e.target.value);
    if (sel) setSelectedURDFPath(sel);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <select
        style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
        value={selectedURDFPath}
        onChange={urdfChangeHandler}
      >
        {URDF_FILE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt.split("/").slice(-2).join("/")}
          </option>
        ))}
      </select>

      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        <DreiOrbitControls makeDefault />

        {robot ? (
          <InteractiveRobot robot={robot} />
        ) : error ? (
          <Html center>{error}</Html>
        ) : (
          <Html center>Loading URDF...</Html>
        )}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default URDFViewer;
