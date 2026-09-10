import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global API Base URL interceptor for deployment (Vercel -> Render backend)
const apiBase = import.meta.env.VITE_API_URL;
if (apiBase) {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string" && input.startsWith("/api")) {
      input = `${apiBase}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith("/api")) {
      input = `${apiBase}${input.pathname}${input.search}`;
    } else if (typeof Request !== "undefined" && input instanceof Request && input.url.startsWith("/")) {
      input = new Request(`${apiBase}${input.url}`, input);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById("root")!).render(<App />);

