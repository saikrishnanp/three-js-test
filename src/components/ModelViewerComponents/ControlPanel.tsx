import React from "react";
import type { Mode } from "../ModelViewer";

interface ControlsPanelProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onFileChange: React.ChangeEventHandler<HTMLInputElement>;
  onExport: () => void;
  onClear: () => void;
}

export default function ControlsPanel({
  mode,
  onModeChange,
  onFileChange,
  onExport,
  onClear,
}: ControlsPanelProps) {
  return (
    <div style={{ position: "absolute", zIndex: 10, padding: 10 }}>
      <input
        type="file"
        accept=".stl,.ply,.obj,.glb,.gltf"
        onChange={onFileChange}
      />
      <div style={{ marginTop: 8 }}>
        <button onClick={() => onModeChange("view")}>View</button>
        <button onClick={() => onModeChange("raytrace")}>Ray Trace</button>
        <button onClick={() => onModeChange("glyph")}>Glyph Cloud</button>
        <button onClick={onExport}>Export GLTF</button>
        <button onClick={onClear}>Clear Model</button>
      </div>
      <div style={{ marginTop: 6 }}>Mode: {mode}</div>
    </div>
  );
}
