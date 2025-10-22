import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";

export function useExportGLTF(
  geometry: THREE.BufferGeometry | null,
  object: THREE.Object3D | null,
  markers: THREE.Vector3[]
) {
  return () => {
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

    interface GLTFExportCallback {
        (gltf: object): void;
    }

    interface GLTFExportErrorCallback {
        (error: unknown): void;
    }

    exporter.parse(
        sceneToExport,
        ((gltf: object) => {
            const blob: Blob = new Blob([JSON.stringify(gltf)], {
                type: "application/json",
            });
            const url: string = URL.createObjectURL(blob);
            const a: HTMLAnchorElement = document.createElement("a");
            a.href = url;
            a.download = "exported_model.gltf";
            a.click();
            URL.revokeObjectURL(url);
        }) as GLTFExportCallback,
        ((error: unknown) => console.error("Error exporting GLTF", error)) as GLTFExportErrorCallback
    );
  };
}
