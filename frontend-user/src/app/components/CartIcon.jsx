"use client";

import { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";

export default function CartIcon() {
  const [animationData, setAnimationData] = useState(null);
  const lottieRef = useRef();

  useEffect(() => {
    fetch("/animations/cart.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <div
      onMouseEnter={() => lottieRef.current?.play()}   
      onMouseLeave={() => lottieRef.current?.stop()}   
      style={{ width: 33, height: 33, cursor: "pointer" }}
    >
      <Lottie
        style={{ filter: "drop-shadow(0 0 1px #d1f3fa)" }}
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}      
        autoplay={false}  
      />
    </div>
  );
}
