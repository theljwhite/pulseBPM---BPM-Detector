import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Grommet, ThemeType } from "grommet";
import { BrowserRouter } from "react-router-dom";

const themeForGrommet: ThemeType = {
  global: {
    colors: {
      neonGreen: "#39ff14",
      lightBlue: "#1d7fc0",
      darkBlue: "#090330",
      pink: "#f062a9",
      ventosaBlue: "#1794fe",
    },
  },

  button: {
    color: { dark: "light-1", light: "light-1" },
    default: {
      background: {
        color: "#f062a9",
      },
      border: {
        color: "light-1",
      },
    },
    border: {
      color: "#FFFFFF",
    },
  },
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Grommet theme={themeForGrommet}>
        <App />
      </Grommet>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
