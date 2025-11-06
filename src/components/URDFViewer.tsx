import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls as DreiOrbitControls,
  Html,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import * as THREE from "three";
import URDFLoader, { type URDFJoint } from "urdf-loader";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
type OrbitControlsType = InstanceType<typeof OrbitControls>;

// ---- Types ----
type Nullable<T> = T | null;

type URDFJointExtended = URDFJoint & {
  setJointValue?: (val: number) => void;
  setAngle?: (val: number) => void;
};

const randomColors = ["red", "green", "blue", "yellow", "purple", "orange"];
let randomColorCounter = 0;

// ---- Interactive Robot ----
const InteractiveRobot = ({
  robot,
  color = "red",
}: {
  robot: THREE.Object3D;
  color?: number | string;
}) => {
  const { gl, camera, get } = useThree();
  const controlsRef = useRef<OrbitControlsType | null>(null);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  const currentJoint = useRef<URDFJointExtended | null>(null);
  const hoveredMesh = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!robot) return;

    // Ensure all children are loaded before traversing to apply color to all the parts
    setTimeout(() => {
      robot.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
                (m as THREE.MeshStandardMaterial).color.set(
                  randomColors[randomColorCounter % randomColors.length]
                );
                randomColorCounter++;
            });
          } else {
            (mesh.material as THREE.MeshStandardMaterial).color.set(
              randomColors[randomColorCounter % randomColors.length]
            );
            randomColorCounter++;
          }
        }
      });
    }, 300); // Defer traversal to next tick to ensure all children are loaded
  }, [robot, color]);

  // Pointer math helper
  const setMouseFromEvent = useCallback(
    (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    },
    [gl, mouse]
  );

  // Select joint
  const onPointerDown = useCallback(
    (event: PointerEvent) => {
      if (!robot) return;
      setMouseFromEvent(event);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(robot, true);
      if (intersects.length === 0) return;

      const mesh = intersects[0].object as THREE.Mesh;
      let joint: THREE.Object3D | null = mesh.parent;
      while (joint && !(joint as URDFJoint).isURDFJoint) {
        joint = joint.parent;
      }

      if (joint && (joint as URDFJoint).isURDFJoint) {
        currentJoint.current = joint as URDFJointExtended;
        if (controlsRef.current) controlsRef.current.enabled = false;
      }
    },
    [robot, camera, raycaster, mouse, setMouseFromEvent]
  );

  // Hover and rotate
  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      setMouseFromEvent(event);
      raycaster.setFromCamera(mouse, camera);

      // Hover effect
      if (!currentJoint.current && robot) {
        const intersects = raycaster.intersectObject(robot, true);
        const hovered =
          intersects.length > 0 ? (intersects[0].object as THREE.Mesh) : null;

        if (hoveredMesh.current !== hovered) {
          const oldMat = hoveredMesh.current?.material as
            | THREE.MeshStandardMaterial
            | undefined;
          if (oldMat?.emissive) oldMat.emissive.setHex(0x000000);

          hoveredMesh.current = hovered;
          const newMat = hovered?.material as
            | THREE.MeshStandardMaterial
            | undefined;
          if (newMat?.emissive) newMat.emissive.setColorName("red");
        }
      }

      // Rotate selected joint
      const joint = currentJoint.current;
      if (joint) {
        const deltaAngle = event.movementX * 0.01;
        const currentAngle = (joint.angle ?? 0) as number;
        const lower = joint.limit?.lower ?? -Infinity;
        const upper = joint.limit?.upper ?? Infinity;
        const newAngle = THREE.MathUtils.clamp(
          currentAngle + deltaAngle,
          lower,
          upper
        );

        if (typeof joint.setJointValue === "function")
          joint.setJointValue(newAngle);
        else if (typeof joint.setAngle === "function") joint.setAngle(newAngle);
      }
    },
    [camera, robot, raycaster, mouse, setMouseFromEvent]
  );

  const onPointerUp = useCallback(() => {
    currentJoint.current = null;
    if (controlsRef.current) controlsRef.current.enabled = true;
  }, []);

  // Attach events
  useEffect(() => {
    const dom = gl.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);
    dom.addEventListener("pointerleave", onPointerUp);
    return () => {
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      dom.removeEventListener("pointerleave", onPointerUp);
    };
  }, [gl, onPointerDown, onPointerMove, onPointerUp]);

  // Get OrbitControls instance
  useFrame(() => {
    if (!controlsRef.current && get().controls)
      controlsRef.current = get().controls as OrbitControlsType;
  });

  return <primitive object={robot} />;
};

// ---- URDF Viewer ----
const URDF_FILE_OPTIONS = [
  "/URDFs/T12/urdf/T12.URDF",
  "/URDFs/TriATHLETE/urdf/TriATHLETE.URDF",
];

const URDFViewer = () => {
  const [robot, setRobot] = useState<Nullable<THREE.Object3D>>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedURDFPath, setSelectedURDFPath] = useState(
    URDF_FILE_OPTIONS[0]
  );

  useEffect(() => {
    const loader = new URDFLoader();
    loader.packages = "/URDFs";

    // const manager = loader.manager || THREE.DefaultLoadingManager;
    // manager.setURLModifier((url) => {
    //   if (url.startsWith("/")) return window.location.origin + url;
    //   return url;
    // });

    // Optional code to support STL and OBJ meshes
    loader.loadMeshCb = (path, manager, onComplete) => {
      const ext = path.split(".").pop()?.toLowerCase();
      if (ext === "stl") {
        new STLLoader(manager).load(
          path,
          (geom: THREE.BufferGeometry) => {
            const mesh = new THREE.Mesh(
              geom,
              new THREE.MeshStandardMaterial({ color: 0xcccccc })
            );
            onComplete(mesh);
          },
          undefined,
          () => onComplete(new THREE.Object3D())
        );
      } else if (ext === "obj") {
        new OBJLoader(manager).load(
          path,
          (obj: THREE.Group) => onComplete(obj),
          undefined,
          () => onComplete(new THREE.Object3D())
        );
      } else onComplete(new THREE.Object3D());
    };

    loader.load(
      selectedURDFPath,
      (urdf) => {
        urdf.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              metalness: 0.5,
              roughness: 0.5,
            });
          }
        });

        const box = new THREE.Box3().setFromObject(urdf);
        const center = box.getCenter(new THREE.Vector3());
        urdf.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z) || 1;
        urdf.scale.setScalar(1 / maxAxis);

        setRobot(urdf);
      },
      undefined,
      () => setError("Failed to load URDF")
    );
  }, [selectedURDFPath]);

  const urdfChangeHandler = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sel = URDF_FILE_OPTIONS.find((o) => o === e.target.value);
    if (sel) setSelectedURDFPath(sel);
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <select
        style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
        value={selectedURDFPath}
        onChange={urdfChangeHandler}
      >
        {URDF_FILE_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt.split("/").slice(-2).join("/")}
          </option>
        ))}
      </select>

      <Canvas camera={{ position: [0, 0, 10], fov: 50 }} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        <DreiOrbitControls makeDefault />

        {robot ? (
          <InteractiveRobot robot={robot} />
        ) : error ? (
          <Html center>{error}</Html>
        ) : (
          <Html center>Loading URDF...</Html>
        )}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default URDFViewer;
