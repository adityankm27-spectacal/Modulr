import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The Modulr stack mark on cream, for iOS home screens and Safari. */
export default function AppleIcon() {
  const bar = (color: string) => (
    <div style={{ width: 124, height: 30, borderRadius: 15, background: color }} />
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "#fff4e2",
      }}
    >
      {bar("#ffc629")}
      {bar("#5c73ff")}
      {bar("#2343ff")}
    </div>,
    size,
  );
}
