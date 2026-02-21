"use client";
import packageJson from "../package.json";

export default function VersionBadge() {
    return (
        <div style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            fontSize: "10px",
            fontWeight: 800,
            color: "var(--app-text-muted)",
            opacity: 0.5,
            zIndex: 9000,
            pointerEvents: "none",
            letterSpacing: "0.1em"
        }}>
            v{packageJson.version}
        </div>
    );
}
