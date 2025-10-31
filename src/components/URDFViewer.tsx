import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";
import URDFLoader from "urdf-loader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";

type Nullable<T> = T | null;

export default function URDFViewer() {
  const [robot, setRobot] = useState<Nullable<THREE.Object3D>>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Path to your URDF file
    const urdfPath = "/T12/urdf/T12.URDF";

    // ✅ Base directory where mesh paths resolve
    const loader = new URDFLoader();
    loader.packages = "/T12/";

    // ✅ Optional: custom mesh loader (only needed if your URDF uses .obj too)
    loader.loadMeshCb = (path, manager, onComplete) => {
      const ext = path.split(".").pop()?.toLowerCase();

      if (ext === "stl") {
        new STLLoader(manager).load(
          path,
          (geom: THREE.BufferGeometry) => {
            const mesh = new THREE.Mesh(
              geom,
              new THREE.MeshStandardMaterial({ color: 0x999999 })
            );
            onComplete(mesh);
          },
          undefined,
          (err: ErrorEvent) => {
            console.warn("Failed to load STL mesh:", path, err);
            onComplete(new THREE.Object3D());
          }
        );
      } else if (ext === "obj") {
        new OBJLoader(manager).load(
          path,
          (obj: THREE.Object3D) => onComplete(obj),
          undefined,
          (err: ErrorEvent) => {
            console.warn("Failed to load OBJ mesh:", path, err);
            onComplete(new THREE.Object3D());
          }
        );
      } else {
        console.warn(`Unsupported mesh type: ${path}`);
        onComplete(new THREE.Object3D());
      }
    };

    // ✅ Load URDF
    loader.load(
      urdfPath,
      (urdf: THREE.Object3D) => {
        urdf.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).castShadow = true;
            (child as THREE.Mesh).receiveShadow = true;
          }
        });

        // Center and scale nicely in scene
        const box = new THREE.Box3().setFromObject(urdf);
        const center = box.getCenter(new THREE.Vector3());
        urdf.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        urdf.scale.setScalar((1 / maxAxis)); // scale to visible size

        console.log("URDF bounding box:", new THREE.Box3().setFromObject(urdf));
        setRobot(urdf);
      },
      undefined,
      (err: ErrorEvent) => {
        console.error("URDF Load Error:", err);
        setError("Failed to load URDF");
      }
    );
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} />
        <OrbitControls makeDefault />

        {robot ? (
          <primitive object={robot} />
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
}
