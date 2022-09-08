import React from "react";
import "./styles.css";
import { Routes, Route } from "react-router-dom";
import BPMDetectMain from "./Components/BPMDetectMain";
import Navbar from "./Components/Navbar";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import noteFour from "./Images/2NoteBlue2.svg";

function App() {
  const particlesLoaded = (container: any) => {
    return container;
  };

  const particlesInit = async (main: any) => {
    await loadFull(main);
  };

  return (
    <div className="App">
      <React.Fragment>
        <Particles
          init={particlesInit}
          loaded={particlesLoaded}
          id="tsparticles"
          params={{
            fpsLimit: 60,
            particles: {
              color: {
                value: "#1794fe",
              },
              move: {
                collisions: true,
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 900,
                },
                value: 100,
              },
              opacity: {
                value: 0.2,
              },
              shape: {
                type: "image",
                options: {
                  image: {
                    src: `${noteFour}`,
                    width: 100,
                    height: 100,
                    replace_color: false,
                  },
                },
              },

              size: {
                value: { min: 10, max: 40 },
              },
            },
          }}
        />
        <Navbar />
        <Routes>
          <Route path="/" element={<BPMDetectMain />}></Route>
        </Routes>
      </React.Fragment>
    </div>
  );
}

export default App;
