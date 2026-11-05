"use client";

import { createContext, useContext, useState } from "react";

interface AIModeContextValue {
  enabled:    boolean;
  setEnabled: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const AIModeContext = createContext<AIModeContextValue>({
  enabled:    false,
  setEnabled: () => {},
});

export function useAIMode() {
  return useContext(AIModeContext);
}

export function AIModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  return (
    <AIModeContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </AIModeContext.Provider>
  );
}
