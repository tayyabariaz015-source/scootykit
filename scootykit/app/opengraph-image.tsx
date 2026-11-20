import { ImageResponse } from "next/og";

export const alt = "ScootyKit — Everything Your Scooty Needs.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#111827", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="12" fill="#FFFFFF" />
            <path
              transform="translate(4.2 0) skewX(-8)"
              d="M29.5 14.2C27.8 12.6 25.6 11.8 23 11.8c-5 0-8.2 2.9-8.2 6.7 0 4.3 3.7 5.7 8.7 6.6 5.2.9 9 2.6 9 7 0 4-3.6 6.9-9.1 6.9-3.3 0-6.1-1-8.2-3"
              fill="none"
              stroke="#111827"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="35.4" cy="12.6" r="3.4" fill="#F43F5E" />
          </svg>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            Scooty<span style={{ color: "#F43F5E" }}>Kit</span>
          </div>
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05 }}>Everything Your Scooty Needs.</div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#CBD5E1" }}>Quality scooty &amp; scooter accessories in Pakistan</div>
      </div>
    ),
    size,
  );
}
