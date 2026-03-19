import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./assets/styles/tailwind.css";
import "./assets/styles/base.css";

createRoot(document.getElementById("root")!).render(
  <App />,
);
