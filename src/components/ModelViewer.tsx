import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";

import ModelMesh from "../components/ModelViewerComponents/ModelMesh";
import GlbMesh from "../components/ModelViewerComponents/GlbMesh";
import Markers from "../components/ModelViewerComponents/Markers";
import GlyphCloud from "../components/ModelViewerComponents/GlyphCloud";
import ControlsPanel from "../components/ModelViewerComponents/ControlPanel";
import { useModelLoader } from "../components/ModelViewerComponents/loaders/useModelLoader";
import { useExportGLTF } from "../components/ModelViewerComponents/loaders/useExportGLTF";

export type Mode = "view" | "raytrace" | "glyph";

export default function ModelViewer() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState("");
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [object, setObject] = useState<THREE.Object3D | null>(null);
  const [markers, setMarkers] = useState<THREE.Vector3[]>([]);
  const [mode, setMode] = useState<Mode>("view");

  useModelLoader(fileUrl, fileType, setGeometry, setObject);
  const handleExport = useExportGLTF(geometry, object, markers);

  const handleMeshClick = (point: THREE.Vector3) => {
    if (mode === "raytrace") setMarkers((prev) => [...prev, point]);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    setFileType(ext);
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setMarkers([]);
  };

  const handleClear = () => {
    setFileUrl(null);
    setGeometry(null);
    setObject(null);
    setMarkers([]);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ControlsPanel
        mode={mode}
        onModeChange={setMode}
        onFileChange={handleFileChange}
        onExport={handleExport}
        onClear={handleClear}
      />

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
