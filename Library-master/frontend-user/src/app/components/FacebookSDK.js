"use client";

import { FacebookSDKProvider } from "./FacebookSDKContext";

export default function FacebookSDK({ children }) {
  return <FacebookSDKProvider>{children}</FacebookSDKProvider>;
}
