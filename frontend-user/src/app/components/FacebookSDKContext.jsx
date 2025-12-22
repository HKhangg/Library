"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Script from "next/script";

const FacebookSDKContext = createContext({ isSDKLoaded: false, error: null });

export const FacebookSDKProvider = ({ children }) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    try {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "1685034505554675",
        cookie: true,
        xfbml: true,
        version: "v19.0",
      });
      setIsSDKLoaded(true);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi khởi tạo Facebook SDK:", err);
      setError("Không thể khởi tạo Facebook SDK. Vui lòng thử lại sau.");
      setIsSDKLoaded(false);
    }
  };

  const handleError = () => {
    console.error("Không thể tải Facebook SDK");
    setError(
      "Không thể tải Facebook SDK. Kiểm tra kết nối mạng hoặc thử lại sau."
    );
    setIsSDKLoaded(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.FB) {
      setIsSDKLoaded(true);
    }
  }, []);

  return (
    <>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={handleLoad}
        onError={handleError}
      />
      <FacebookSDKContext.Provider value={{ isSDKLoaded, error }}>
        {children}
      </FacebookSDKContext.Provider>
    </>
  );
};

export const useFacebookSDK = () => useContext(FacebookSDKContext);
