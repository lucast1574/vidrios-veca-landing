import React, { type CSSProperties } from "react";
const paths = {
  "arrow-up-right": "M7 17 17 7M7 7h10v10",
  "arrow-right": "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
};
export function Icon({
  name = "arrow-up-right",
  size = 20,
  className = "",
  style,
}: {
  name?: keyof typeof paths;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      className={`ve-icon ${className}`}
      width={size}
      height={size}
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
