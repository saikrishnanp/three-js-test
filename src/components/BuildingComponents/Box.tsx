import * as THREE from "three";


function MultiColorBox() {
  // Define materials with different colors for each face (6 sides)
  const materials = [
    new THREE.MeshBasicMaterial({ color: 'yellow' }),     // right
    new THREE.MeshBasicMaterial({ color: 'yellow' }),    // left
    new THREE.MeshBasicMaterial({ color: 'yellow' }),   // top
    new THREE.MeshBasicMaterial({ color: 'yellow' }),  // bottom
    new THREE.MeshBasicMaterial({ color: 'yellow' }),  // front
    new THREE.MeshBasicMaterial({ color: 'purple' })   // back
  ]

  return (
    <mesh rotation={[3, 3, 3]} position={[2,2,1]} material={materials}>
      <boxGeometry args={[2, 2, 2]} />
    </mesh>
  )
}

export default MultiColorBox;
