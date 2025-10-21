import { Canvas } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3 } from "three";
import { OrbitControls, Html } from "@react-three/drei";
import { useControls } from "leva";

// Simple 3-joint robotic arm
function RoboticArm({ t, points }: { t: number; points: [number, number, number][] }) {
  // Calculate spline
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  const pos = curve.getPoint(t);

  // For demo: 3 links, each 1.5 units
  // We'll just point each joint toward the next spline point for now
  // (Inverse kinematics is complex; this is a simple visual follow)
  const joint1 = points[0];
  const joint2 = points[1];
  const joint3 = points[2];

  return (
    <group>
      {/* Spline path */}
      <mesh>
        <tubeGeometry args={[curve, 100, 0.05, 8, false]} />
        <meshStandardMaterial color="#00bcd4" opacity={0.5} transparent />
      </mesh>
      {/* Joints and links */}
      {/* Base */}
      <mesh position={joint1}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Link 1 */}
      <mesh position={[(joint1[0] + joint2[0]) / 2, (joint1[1] + joint2[1]) / 2, (joint1[2] + joint2[2]) / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {/* Joint 2 */}
      <mesh position={joint2}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Link 2 */}
      <mesh position={[(joint2[0] + joint3[0]) / 2, (joint2[1] + joint3[1]) / 2, (joint2[2] + joint3[2]) / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      {/* Joint 3 */}
      <mesh position={joint3}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* End effector (follows spline) */}
      <mesh position={pos.toArray()}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff5722" />
      </mesh>
      <Html position={pos.toArray()} center style={{ background: '#fff', padding: 4, borderRadius: 4, fontSize: 12, border: '1px solid #ccc' }}>
        t={t.toFixed(2)}
      </Html>
    </group>
  );
}

export default function RoboticArmScene() {
  // Spline control points
  const { p0, p1, p2, p3, t } = useControls({
    p0: { value: [0, 0, 0], step: 0.1, label: 'Base' },
    p1: { value: [1, 1.5, 0], step: 0.1, label: 'Joint 1' },
    p2: { value: [2, 2, 1], step: 0.1, label: 'Joint 2' },
    p3: { value: [3, 1, 0], step: 0.1, label: 'End' },
    t: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Arm Position' },
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [5, 5, 8], fov: 50 }} style={{ background: '#f4f7fa' }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.7} />
        <RoboticArm t={t} points={[p0, p1, p2, p3]} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
