import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

interface ModelMeshProps {
  geometry: THREE.BufferGeometry;
  color?: string;
  onMeshClick?: (point: THREE.Vector3) => void;
}

export default function ModelMesh({
  geometry,
  color = "#885555",
  onMeshClick,
}: ModelMeshProps) {
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
