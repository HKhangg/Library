"use client";

import Script from "next/script";

export default function AnimatedIcon({ src, trigger = "hover", size = 24, colors }) {
  return (
    <>
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="beforeInteractive" />

      <lord-icon
        src={src}
        trigger={trigger}
        colors={colors}
        style={{ width: `${size}px`, height: `${size}px` }}
      ></lord-icon>
    </>
  );
}
