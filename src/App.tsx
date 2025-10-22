import RoboticArmScene from "./components/RoboticArmScene";
import BuildingScene from "./components/BuildingComponents/BuildingScene";
import StlViewer from "./components/StlViewver";
import "./App.css";
import { useState } from "react";

function App() {
  const [tab, setTab] = useState<"building" | "robotic" | "model" | "">("");

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
      </div>
      <div style={{ flex: 1, minWidth: 0, width: "100%", height: "100%" }}>
        {tab === "building" && <BuildingScene />}
        {tab === "robotic" && <RoboticArmScene />}
        {tab === "model" && <StlViewer />}
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
