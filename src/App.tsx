import RoboticArmScene from "./components/RoboticArmScene";
import BuildingScene from "./components/BuildingComponents/BuildingScene";
import StlViewer from './components/StlViewver';
import "./App.css";

function App() {
  return (
    <div
      className="App"
    >
      {/* <div style={{ flex: 1, minWidth: 0 }}>
        <h2>Building Visualization</h2>
        <BuildingScene />
      </div> */}
      {/* <div style={{ flex: 1, minWidth: 0 }}>
        <h2>Robotic Arm</h2>
        <RoboticArmScene />
      </div> */}
      <div style={{ flex: 1, minWidth: 0, width: "calc(100vw - 100px)", height: "calc(100vh - 100px)" }}>
        <StlViewer />
      </div>
    </div>
  );
}

export default App;
