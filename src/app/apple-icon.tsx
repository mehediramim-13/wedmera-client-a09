import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#FFFBF8",
          borderRadius: 38,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 48 48" fill="none">
          <circle cx="18" cy="24" r="12" stroke="#9F2E55" strokeWidth="3" />
          <circle cx="30" cy="24" r="12" stroke="#C9A24B" strokeWidth="3" />
          <path
            d="m16 21 4 9 4-7 4 7 4-9"
            stroke="#2B1E24"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
    ),
    size,
  );
}
