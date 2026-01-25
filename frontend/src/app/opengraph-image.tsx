import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background:
            "linear-gradient(135deg, #f0e6d2 0%, #f6f4ef 45%, #ffffff 100%)",
          color: "#1e1b16",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          AgentSkill Hub
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#6f655a",
            maxWidth: 900,
          }}
        >
          Discover trending Claude Skill projects on GitHub.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 20,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#b65f3b",
          }}
        >
          agentskill.work
        </div>
      </div>
    ),
    size,
  );
}
