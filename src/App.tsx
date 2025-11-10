import { useState } from "react";

import RoboticArmScene from "./components/RoboticArmScene";
import BuildingScene from "./components/BuildingComponents/BuildingScene";
import ModelViewer from "./components/ModelViewer";
import URDFViewer from "./components/URDFViewer/URDFViewer";
import ProgrammableSpline from "./components/ProgrammableSpline/ProgrammableSpline";

import "./App.css";

function App() {
  const [tab, setTab] = useState<"building" | "robotic" | "model" | "urdf" | "programmable-spline" | "">("");

  return (
    <div
      className="App"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #ccc",
          background: "#f7f7f7",
        }}
      >
        <button
          style={{
            padding: "12px 32px",
            border: "none",
            borderBottom:
              tab === "building"
                ? "3px solid #1976d2"
                : "3px solid transparent",
            background: "none",
            fontWeight: tab === "building" ? "bold" : "normal",
            cursor: "pointer",
            outline: "none",
          }}
          onClick={() => setTab("building")}
        >
          Building
        </button>
        <button
          style={{
            padding: "12px 32px",
            border: "none",
            borderBottom:
              tab === "robotic" ? "3px solid #1976d2" : "3px solid transparent",
            background: "none",
            fontWeight: tab === "robotic" ? "bold" : "normal",
            cursor: "pointer",
            outline: "none",
          }}
          onClick={() => setTab("robotic")}
        >
          Robotic Arm
        </button>
        <button
          style={{
            padding: "12px 32px",
            border: "none",
            borderBottom:
              tab === "model" ? "3px solid #1976d2" : "3px solid transparent",
            background: "none",
            fontWeight: tab === "model" ? "bold" : "normal",
            cursor: "pointer",
            outline: "none",
          }}
          onClick={() => setTab("model")}
        >
          Loading Model
        </button>
        <button
          style={{
            padding: "12px 32px",
            border: "none",
            borderBottom:
              tab === "urdf" ? "3px solid #1976d2" : "3px solid transparent",
            background: "none",
            fontWeight: tab === "urdf" ? "bold" : "normal",
            cursor: "pointer",
            outline: "none",
          }}
          onClick={() => setTab("urdf")}
        >
          URDF viewer
        </button>
        <button
          style={{
            padding: "12px 32px",
            border: "none",
            borderBottom:
              tab === "programmable-spline" ? "3px solid #1976d2" : "3px solid transparent",
            background: "none",
            fontWeight: tab === "programmable-spline" ? "bold" : "normal",
            cursor: "pointer",
            outline: "none",
          }}
          onClick={() => setTab("programmable-spline")}
        >
          Programmable spline
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0, width: "100vw", height: "100vh" }}>
        {/* <VoxelPainter /> */}
        {tab === "building" && <BuildingScene />}
        {tab === "robotic" && <RoboticArmScene />}
        {tab === "model" && <ModelViewer />}
        {tab === "urdf" && <URDFViewer />}
        {tab === "programmable-spline" && <ProgrammableSpline />}
        {tab === "" && (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Please select a tab to view content.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
