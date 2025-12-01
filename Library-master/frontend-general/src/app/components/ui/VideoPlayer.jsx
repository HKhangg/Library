"use client"

import React, { useEffect, useRef } from "react"

export default function VideoPlayer({ src, startTime = 0, className = "" }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.currentTime = startTime;
    }
}, [startTime]);
  return (
    <video
    muted
    autoPlay
    loop
    playsInline
    src={src}
    ref={videoRef}
    className={`pointer-events-none select-none ${className}`}
    />
  )
}
