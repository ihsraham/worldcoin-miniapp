// minikit-provider.tsx
import { useEffect, type ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

interface MiniKitProviderProps {
  children: ReactNode;
}

export default function MiniKitProvider({ children }: MiniKitProviderProps) {
  useEffect(() => {
    const init = async () => {
      try {
        MiniKit.install();
        console.log("MiniKit installed successfully");
      } catch (error) {
        console.error("Error installing MiniKit:", error);
      }
    };

    init();
  }, []);

  return <>{children}</>;
}
