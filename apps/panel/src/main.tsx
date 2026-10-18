import "./features/access/workspace.css";
import React from "react";
import { ThemeProvider } from "./theme/ThemeProvider";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "@veca/ui/src/select.css";
import "@veca/ui/src/article.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
import "./features/operations/operations.css";

import "./theme/theme.css";
