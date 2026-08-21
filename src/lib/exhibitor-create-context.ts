import { createContext, useContext } from "react";

export const ExhibitorCreateContext = createContext<(() => void) | null>(null);

export function useOpenExhibitorCreate() {
  const openCreate = useContext(ExhibitorCreateContext);
  return openCreate ?? (() => undefined);
}