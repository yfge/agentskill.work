import { ImageResponse } from "next/og";

import { getApiBase } from "@/lib/apiBase";
import { messages, type Language } from "@/lib/i18n";
import { normalizeClaudeSkill } from "@/lib/text";
import { Skill } from "@/types/skill";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function resolveLanguage(value: string): Language {
  return value === "en" ? "en" : "zh";
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 10_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

function clampText(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 3))}...`;
}

async function fetchSkill(owner: string, repo: string): Promise<Skill | null> {
  const base = getApiBase();
  const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const url = `${trimmedBase}/skills/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function OpenGraphImage({
  params,
}: {
  params: { lang: string; owner: string; repo: string };
}) {
  const lang = resolveLanguage(params.lang);
  const copy = messages[lang];
  const skill = await fetchSkill(params.owner, params.repo);

  if (!skill) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background: "linear-gradient(135deg, #f0e6d2 0%, #f6f4ef 45%, #ffffff 100%)",
          color: "#1e1b16",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 54, fontWeight: 700 }}>AgentSkill Hub</div>
        <div style={{ marginTop: 16, fontSize: 26, color: "#6f655a" }}>
          Claude Skill
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 22,
            color: "#6f655a",
            maxWidth: 980,
          }}
        >
          {lang === "zh" ? "项目详情暂不可用。" : "Skill detail is unavailable."}
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 18,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#b65f3b",
          }}
        >
          agentskill.work
        </div>
      </div>,
      size,
    );
  }

  const descriptionRaw =
    lang === "zh"
      ? normalizeClaudeSkill(skill.description_zh || skill.description)
      : skill.description || skill.description_zh;
  const description = descriptionRaw ? clampText(descriptionRaw, 180) : "";
  const topics = (skill.topics || "")
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean)
    .slice(0, 6);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        background: "linear-gradient(135deg, #0b1210 0%, #0f1d1a 40%, #132b22 100%)",
        color: "#f3f5f4",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8fe1c8",
          }}
        >
          Claude Skill
        </div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#8fe1c8",
          }}
        >
          AgentSkill Hub
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05 }}>
          {skill.full_name}
        </div>

        {description && (
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.35,
              color: "#cfe7df",
              maxWidth: 1000,
            }}
          >
            {description}
          </div>
        )}

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              padding: "10px 14px",
              border: "1px solid rgba(143, 225, 200, 0.35)",
              borderRadius: 999,
              color: "#f3f5f4",
            }}
          >
            <span style={{ fontSize: 14, color: "#8fe1c8" }}>{copy.detailStars}</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              {formatCompact(skill.stars)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              padding: "10px 14px",
              border: "1px solid rgba(143, 225, 200, 0.35)",
              borderRadius: 999,
              color: "#f3f5f4",
            }}
          >
            <span style={{ fontSize: 14, color: "#8fe1c8" }}>{copy.detailForks}</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              {formatCompact(skill.forks)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              padding: "10px 14px",
              border: "1px solid rgba(143, 225, 200, 0.35)",
              borderRadius: 999,
              color: "#f3f5f4",
            }}
          >
            <span style={{ fontSize: 14, color: "#8fe1c8" }}>
              {copy.detailLanguage}
            </span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>
              {skill.language || copy.detailUnknown}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {topics.map((topic) => (
            <span
              key={topic}
              style={{
                fontSize: 14,
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255, 255, 255, 0.10)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                color: "#cfe7df",
              }}
            >
              {topic}
            </span>
          ))}
        </div>
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#8fe1c8",
          }}
        >
          agentskill.work
        </div>
      </div>
    </div>,
    size,
  );
}
