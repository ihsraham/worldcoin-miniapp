"use client"; // Required for Next.js

import { ReactNode, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    MiniKit.install("app_0b25c0e41ad700c4716ff0054420c269");
    console.log(MiniKit.isInstalled());
  }, []);

  return <>{children}</>;
}
