import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/cyrillic-300.css";
import "@fontsource/inter/latin-300.css";
import "@fontsource/inter/cyrillic-400.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/cyrillic-500.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/cyrillic-600.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/cyrillic-700.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/montserrat/cyrillic-500.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/cyrillic-600.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/cyrillic-700.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/cyrillic-800.css";
import "@fontsource/montserrat/latin-800.css";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Ошибки вне React (обработчики событий, таймеры, промисы без catch) иначе пропадают бесследно.
window.addEventListener("error", (e) => console.error("[window] Необработанная ошибка:", e.message, e.filename, e.lineno));
window.addEventListener("unhandledrejection", (e) => console.error("[window] Необработанная ошибка промиса:", e.reason));

createRoot(document.getElementById("root")!).render(
  <StrictMode><ErrorBoundary><App /></ErrorBoundary></StrictMode>
);
