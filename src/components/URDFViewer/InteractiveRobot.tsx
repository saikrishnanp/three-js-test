import { useEffect, useMemo, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type URDFJoint } from "urdf-loader";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

type OrbitControlsType = InstanceType<typeof OrbitControls>;

type URDFJointExtended = URDFJoint & {
  setJointValue?: (val: number) => void;
  setAngle?: (val: number) => void;
};

const randomColors = ["red", "green", "blue", "yellow", "purple", "orange"];
let randomColorCounter = 0;

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

export default InteractiveRobot;