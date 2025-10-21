// StlViewer.tsx
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  GizmoViewport,
  GizmoHelper,
} from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { handleExport } from "../util";

type Nullable<T> = T | null;

function ModelMesh({
  geometry,
  color = "#773939ff",
}: {
  geometry: THREE.BufferGeometry;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Simple slow rotation so user sees shape (optional)
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0025;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={0.6} roughness={0.6} />
    </mesh>
  );
}

export default function StlViewer() {
  const [fileUrl, setFileUrl] = useState<Nullable<string>>(null);
  const [geometry, setGeometry] =
    useState<Nullable<THREE.BufferGeometry>>(null);
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load model whenever fileUrl changes
  useEffect(() => {
    if (!fileUrl || !fileType) {
      setGeometry(null);
      setObject(null);
      return;
    }

    setLoading(true);

    // Loaders
    const stlLoader = new STLLoader();
    const plyLoader = new PLYLoader();
    const objLoader = new OBJLoader();
    const gltfLoader = new GLTFLoader();

    const handleBufferGeometry = (geom: THREE.BufferGeometry) => {
      if (!geom.attributes.normal) geom.computeVertexNormals();
      geom.computeBoundingBox();
      const bbox = geom.boundingBox;
      if (bbox) {
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        geom.translate(-center.x, -center.y, -center.z);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxAxis = Math.max(size.x, size.y, size.z);
        if (maxAxis > 0) {
          const desiredSize = 20;
          const scale = desiredSize / maxAxis;
          geom.scale(scale, scale, scale);
        }
      }
      setGeometry(geom);
      setObject(null);
      setLoading(false);
    };

    const handleObject = (obj: THREE.Object3D) => {
      // Center & scale object
      const box = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      box.getCenter(center);
      // Center all child meshes
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).position.sub(center);
        }
      });
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxAxis = Math.max(size.x, size.y, size.z);
      if (maxAxis > 0) {
        const desiredSize = 20;
        const scale = desiredSize / maxAxis;
        obj.scale.setScalar(scale);
      }
      setObject(obj);
      setGeometry(null);
      setLoading(false);
    };

    // Choose loader
    if (fileType === "stl") {
      stlLoader.load(fileUrl, handleBufferGeometry, undefined, console.error);
    } else if (fileType === "ply") {
      plyLoader.load(fileUrl, handleBufferGeometry, undefined, console.error);
    } else if (fileType === "obj") {
      objLoader.load(fileUrl, handleObject, undefined, console.error);
    } else if (fileType === "gltf" || fileType === "glb") {
      gltfLoader.load(
        fileUrl,
        (gltf: { scene: THREE.Scene }) => {
          if (gltf.scene) handleObject(gltf.scene);
          else console.error("Invalid GLTF file");
        },
        undefined,
        console.error
      );
    }

    return () => {
      if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl, fileType]);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["stl", "ply", "obj", "gltf", "glb"].includes(ext || "")) {
      alert("Only STL, OBJ, GLB, GLTF, or PLY files are supported.");
      return;
    }
    setFileType(ext!);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
  };

  const clearModel = () => {
    setFileUrl(null);
    setFileType("");
    setGeometry(null);
    setObject(null);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#c0bbbbff",
      }}
    >
      {/* UI overlay */}
      <div
        style={{
          position: "absolute",
          zIndex: 10,
          padding: 12,
          color: "#970a0aff",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="file"
            accept=".stl,.ply,.obj,.glb,.gltf"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-upload"
          />
          <button
            onClick={() => document.getElementById("file-upload")?.click()}
            style={{ padding: "4px 12px" }}
          >
            {fileUrl ? "Change file" : "Choose .stl/.obj/.ply/.glb file"}
          </button>
          <span style={{ minWidth: 120, fontSize: 13 }}>
            {fileUrl
              ? `Selected: ${fileType.toUpperCase()}`
              : "No file selected"}
          </span>
          <button onClick={clearModel} style={{ marginLeft: 8 }}>
            Clear model
          </button>
          <button
            onClick={() => handleExport({ object, geometry })}
            disabled={!geometry && !object}
          >
            Export as GLTF
          </button>
        </label>
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
          {loading
            ? `Loading ${fileType.toUpperCase()}...`
            : geometry || object
            ? "Model loaded"
            : "No model loaded"}
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 80], fov: 10 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.0} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.4} />

        <OrbitControls makeDefault enablePan enableZoom enableRotate />

        {geometry ? (
          <>
            {/* Color cannot be changed for OBL files */}
            <ModelMesh geometry={geometry} color="brown" />
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport />
            </GizmoHelper>
          </>
        ) : object ? (
          <primitive object={object} />
        ) : (
          <Html center>
            <div style={{ padding: 8 }}>
              Select an STL, OBJ, PLY, or GLB/GLTF file to visualize
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  );
}
