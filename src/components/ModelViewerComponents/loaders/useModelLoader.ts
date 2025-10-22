import { useEffect } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function useModelLoader(
  fileUrl: string | null,
  fileType: string,
  setGeometry: (geom: THREE.BufferGeometry | null) => void,
  setObject: (obj: THREE.Object3D | null) => void
) {
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
      gltfLoader.load(fileUrl, (gltf: { scene: THREE.Object3D<THREE.Object3DEventMap>; }) => handleObject(gltf.scene));

    return () => {
      if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl, fileType]);
}
