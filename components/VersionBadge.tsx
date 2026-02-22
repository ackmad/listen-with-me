// Server Component — no "use client" needed, runs at build time
// Reads version directly from package.json at build time
import { version } from "../package.json";

export default function VersionBadge() {
    return (
        <div style={{
            position: "fixed",
            bottom: "10px",
            right: "10px",
            fontSize: "10px",
            fontWeight: 800,
            color: "var(--text-muted)",
            opacity: 0.5,
            zIndex: 9000,
            pointerEvents: "none",
            letterSpacing: "0.1em"
        }}>
            v{version}
        </div>
    );
}
