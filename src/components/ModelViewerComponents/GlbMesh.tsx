import * as THREE from "three";

export default function GlbMesh({ object }: { object: THREE.Object3D }) {
  return <primitive object={object} />;
}
