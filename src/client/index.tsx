import { StrictMode } from "hono/jsx";
import { createRoot, hydrateRoot } from "hono/jsx/dom/client";
import { App } from "./app";
import "./index.css";

const ssrRoot = document.getElementById("ssr-root");

if (ssrRoot) {
  hydrateRoot(
    ssrRoot,
    <StrictMode>
      <App />
    </StrictMode>
  );
}

const spaRoot = document.getElementById("spa-root");

if (spaRoot) {
  const root = createRoot(spaRoot);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
