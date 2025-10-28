"use client";

import {createContext, useContext} from "react";

interface FileManagerContextType {
  refreshSidebar: () => void;
}

const FileManagerContext = createContext<FileManagerContextType | null>(null);

export function useFileManager() {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error("useFileManager must be used within FileManagerProvider");
  }
  return context;
}

export const FileManagerProvider = FileManagerContext.Provider;

