import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "WedMera wedding planning";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 20% 20%, #f8e8ec 0, transparent 38%), #fffbf8",
          color: "#2b1e24",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#9f2e55",
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ color: "#6e5c64", fontSize: 30, marginTop: 16 }}>
          Plan the day you&apos;ll remember forever
        </div>
      </div>
    ),
    size,
  );
}
