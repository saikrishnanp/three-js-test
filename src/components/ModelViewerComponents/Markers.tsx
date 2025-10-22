import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export default function Markers({ points }: { points: THREE.Vector3[] }) {
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
      <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}
