import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";

import App from "./App.jsx";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const root = ReactDOM.createRoot(document.getElementById("root"));

if (
  !PUBLISHABLE_KEY ||
  !PUBLISHABLE_KEY.startsWith("pk_") ||
  PUBLISHABLE_KEY.includes("your_clerk_publishable_key_here") ||
  PUBLISHABLE_KEY.includes("placeholder") ||
  PUBLISHABLE_KEY.length < 35
) {
  root.render(
    <React.StrictMode>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0b1e14",
        color: "#ffffff",
        fontFamily: "Outfit, sans-serif",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "460px",
          background: "#173d2a",
          border: "1px solid rgba(212, 247, 114, 0.3)",
          borderRadius: "14px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50px",
            height: "50px",
            borderRadius: "8px",
            background: "rgba(212, 247, 114, 0.15)",
            border: "1px solid rgba(212, 247, 114, 0.45)",
            color: "#d4f772",
            fontSize: "18px",
            fontWeight: "800",
            marginBottom: "24px"
          }}>AI</div>
          <h2 style={{ fontSize: "22px", marginBottom: "10px", fontFamily: "Lora, serif" }}>Configuration Required</h2>
          <p style={{ fontSize: "14px", color: "#a0b8a9", lineHeight: "1.6", marginBottom: "24px" }}>
            Please set your Clerk Publishable Key in the <code>frontend/.env.local</code> file to run the app:
          </p>
          <div style={{
            background: "#08170f",
            padding: "12px",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "13px",
            textAlign: "left",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            marginBottom: "24px",
            wordBreak: "break-all"
          }}>
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
          <p style={{ fontSize: "12px", color: "#6e8a79" }}>
            Create an application in the Clerk Dashboard to retrieve your publishable key.
          </p>
        </div>
      </div>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}