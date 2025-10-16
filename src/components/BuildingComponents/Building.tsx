import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

export type FeatureClickHandler = (
  feature: "Door" | "Window 1" | "Window 2",
  position: [number, number, number]
) => void;

export type FeatureHoverHandler = (
  feature: "Door" | "Window 1" | "Window 2" | null
) => void;

interface BuildingProps {
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void;
  buildingColor: string;
  doorColor: string;
  roofColor: string;
  windowColor: string;
  onFeatureHover?: FeatureHoverHandler;
  onFeatureClick?: FeatureClickHandler;
  hoveredFeature?: string | null;
}

const Building = ({
  onPointerDown,
  buildingColor,
  doorColor,
  roofColor,
  windowColor,
  onFeatureHover,
  onFeatureClick,
  hoveredFeature,
}: BuildingProps) => {
  // Helper to show label on hover
  const handlePointerOver = (
    feature: "Door" | "Window 1" | "Window 2"
  ) => {
    if (onFeatureHover) onFeatureHover(feature);
  };
  const handlePointerOut = () => {
    if (onFeatureHover) onFeatureHover(null);
  };

  // Helper to handle click
  const handleFeatureClick = (
    feature: "Door" | "Window 1" | "Window 2",
    position: [number, number, number],
    event: ThreeEvent<PointerEvent>
  ) => {
    if (onFeatureClick) onFeatureClick(feature, position);
    if (onPointerDown) onPointerDown(event);
  };

  return (
    <group>
      {/* Main building block */}
      <mesh position={[0, 1, 0]} onPointerDown={onPointerDown}>
        <boxGeometry args={[4, 2, 4]} />
        <meshStandardMaterial color={buildingColor} />
      </mesh>
      {/* Roof */}
      <mesh
        position={[0, 2.2, 0]}
      >
        <boxGeometry args={[4.2, 0.4, 4.2]} />
        <meshStandardMaterial color={roofColor} />
      </mesh>
      {/* Door */}
      <mesh
        position={[0, 0.5, 2.05]}
        onPointerOver={() => handlePointerOver("Door")}
        onPointerOut={handlePointerOut}
        onPointerDown={(e) => handleFeatureClick("Door", [0, 0.5, 2.05], e)}
      >
        <boxGeometry args={[0.8, 1, 0.1]} />
        <meshStandardMaterial color={doorColor} />
        {hoveredFeature === "Door" && (
          <Html
            center
            style={{
              pointerEvents: "none",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              border: "1px solid #ccc",
            }}
          >
            Door
          </Html>
        )}
      </mesh>
      {/* Windows */}
      <mesh
        position={[-1.2, 1, 2.05]}
        onPointerOver={() => handlePointerOver("Window 1")}
        onPointerOut={handlePointerOut}
        onPointerDown={(e) =>
          handleFeatureClick("Window 1", [-1.2, 1, 2.05], e)
        }
      >
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color={windowColor} />
        {hoveredFeature === "Window 1" && (
          <Html
            center
            style={{
              pointerEvents: "none",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              border: "1px solid #ccc",
            }}
          >
            Window
          </Html>
        )}
      </mesh>
      <mesh
        position={[-1.2, 1, 2.05]}
        onPointerOver={() => handlePointerOver("Window 1")}
        onPointerOut={handlePointerOut}
        onPointerDown={(e) =>
          handleFeatureClick("Window 1", [-1.2, 1, 2.05], e)
        }
      >
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color={windowColor} />
      </mesh>
      <mesh
        position={[1.2, 1, 2.05]}
        onPointerOver={() => handlePointerOver("Window 2")}
        onPointerOut={handlePointerOut}
        onPointerDown={(e) => handleFeatureClick("Window 2", [1.2, 1, 2.05], e)}
      >
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color={windowColor} />
        {hoveredFeature === "Window 2" && (
          <Html
            center
            style={{
              pointerEvents: "none",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "12px",
              border: "1px solid #ccc",
            }}
          >
            Window
          </Html>
        )}
      </mesh>
      <mesh
        position={[1.2, 1, 2.05]}
        onPointerOver={() => handlePointerOver("Window 2")}
        onPointerOut={handlePointerOut}
        onPointerDown={(e) => handleFeatureClick("Window 2", [1.2, 1, 2.05], e)}
      >
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color={windowColor} />
      </mesh>
    </group>
  );
};

export default Building;
