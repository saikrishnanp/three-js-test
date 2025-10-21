import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import * as THREE from "three";

export const handleExport = ({
  object,
  geometry,
}: {
  object: THREE.Object3D | null;
  geometry: THREE.BufferGeometry | null;
}) => {
  const exporter = new GLTFExporter();
  let exportObj: THREE.Object3D | null = null;
  if (object) exportObj = object;
  else if (geometry)
    exportObj = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
    );

  if (exportObj) {
    exporter.parse(
      exportObj,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "model.glb";
        a.click();
        URL.revokeObjectURL(url);
      },
      (error) => {
        console.error("GLTF export error:", error);
      }
    );
  }
};
