import { createContext, useContext } from "react";

export const MobileContext = createContext(null);

export function useMobileContext() {
  const value = useContext(MobileContext);
  if (!value) throw new Error("MobileContext is required");
  return value;
}
