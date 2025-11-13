import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

type Nullable<T> = T | null;
type Mode = "view" | "raytrace" | "glyph";

/* ------------------ MODEL MESH ------------------ */
function ModelMesh({
  geometry,
  color = "#885555",
  onMeshClick,
}: {
  geometry: THREE.BufferGeometry;
  color?: string;
  onMeshClick?: (point: THREE.Vector3) => void;
}) {
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!onMeshClick || !event.point) return;
    onMeshClick(event.point.clone());
  };

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
    >
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.6} />
    </mesh>
  );
}

function GlbMesh({ object }: { object: THREE.Object3D }) {
  return <primitive object={object} />;
}

/* ------------------ INSTANCED MARKERS ------------------ */
function Markers({ points }: { points: THREE.Vector3[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    points.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [points, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color="red"
        emissive="red"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}

/* ------------------ GLYPH CLOUD ------------------ */
function GlyphCloud({ count = 500 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }
    return arr;
  }, [count]);

  useEffect(() => {
    if (!meshRef.current) return;
    positions.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(i) * 0.2,
        p.y + Math.cos(i * 1.2) * 0.2,
        p.z + Math.sin(i * 0.5) * 0.2
      );
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="#00ffff" />
    </instancedMesh>
  );
}

/* ------------------ MAIN VIEWER ------------------ */
export default function ModelViewer() {
  const [fileUrl, setFileUrl] = useState<Nullable<string>>(null);
  const [geometry, setGeometry] =
    useState<Nullable<THREE.BufferGeometry>>(null);
  const [object, setObject] = useState<Nullable<THREE.Object3D>>(null);
  const [fileType, setFileType] = useState("");
  const [mode, setMode] = useState<Mode>("view");
  const [markers, setMarkers] = useState<THREE.Vector3[]>([]);

  /* ----------- Handle clicks (raytrace) ----------- */
  const handleMeshClick = (point: THREE.Vector3) => {
    if (mode === "raytrace") setMarkers((prev) => [...prev, point]);
  };

  /* ----------- Export to GLTF ----------- */
  const handleExport = () => {
    const exporter = new GLTFExporter();
    const sceneToExport = new THREE.Scene();

    if (geometry) {
      sceneToExport.add(
        new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({ color: "#885555" })
        )
      );
    } else if (object) {
      sceneToExport.add(object.clone());
    }

    markers.forEach((p) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color: "red" })
      );
      marker.position.copy(p);
      sceneToExport.add(marker);
    });

    exporter.parse(
      sceneToExport,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported_model.gltf";
        a.click();
        URL.revokeObjectURL(url);
      },
      (error: unknown) => {
        console.log("Error exporting GLTF", error);
      }
    );
  };

  /* ----------- Load file ----------- */
  useEffect(() => {
    if (!fileUrl || !fileType) {
      setGeometry(null);
      setObject(null);
      return;
    }

    const stlLoader = new STLLoader();
    const plyLoader = new PLYLoader();
    const objLoader = new OBJLoader();
    const gltfLoader = new GLTFLoader();

    const handleBufferGeometry = (geom: THREE.BufferGeometry) => {
      geom.computeVertexNormals();
      geom.computeBoundingBox();
      const bbox = geom.boundingBox;
      if (bbox) {
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        geom.translate(-center.x, -center.y, -center.z);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxAxis = Math.max(size.x, size.y, size.z);
        geom.scale(20 / maxAxis, 20 / maxAxis, 20 / maxAxis);
      }
      setGeometry(geom);
      setObject(null);
    };

    const handleObject = (obj: THREE.Object3D) => {
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
      obj.scale.setScalar(20 / maxAxis);
      setObject(obj);
      setGeometry(null);
    };

    if (fileType === "stl") stlLoader.load(fileUrl, handleBufferGeometry);
    else if (fileType === "ply") plyLoader.load(fileUrl, handleBufferGeometry);
    else if (fileType === "obj") objLoader.load(fileUrl, handleObject);
    else if (["gltf", "glb"].includes(fileType))
      gltfLoader.load(fileUrl, (gltf: { scene: THREE.Scene }) =>
        handleObject(gltf.scene)
      );

    return () => {
      if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl, fileType]);

  /* ----------- File input handler ----------- */
  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    setFileType(ext);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setMarkers([]);
  };

  /* ----------- Render ----------- */
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", zIndex: 10, padding: 10 }}>
        <input
          type="file"
          accept=".stl,.ply,.obj,.glb,.gltf"
          onChange={handleFileChange}
        />
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setMode("view")}>View</button>
          <button onClick={() => setMode("raytrace")}>Ray Trace</button>
          <button onClick={() => setMode("glyph")}>Glyph Cloud</button>
          <button onClick={handleExport}>Export GLTF</button>
          <button
            onClick={() => {
              setFileUrl(null);
              setGeometry(null);
              setObject(null);
              setMarkers([]);
            }}
          >
            Clear Model
          </button>
        </div>
        <div style={{ marginTop: 6 }}>Mode: {mode}</div>
      </div>

      <Canvas camera={{ position: [0, 0, 80], fov: 10 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} />
        <OrbitControls makeDefault />

        {geometry ? (
          <ModelMesh geometry={geometry} onMeshClick={handleMeshClick} />
        ) : object ? (
          <GlbMesh object={object} />
        ) : (
          <Html center>Upload a model</Html>
        )}

        <Markers points={markers} />
        {mode === "glyph" && <GlyphCloud />}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}
