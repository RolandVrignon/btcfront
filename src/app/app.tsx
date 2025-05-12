"use client";

import { ReactNode } from "react";

interface AppProps {
  children: ReactNode;
}

export default function App({ children }: AppProps) {
  return <div className="app-container">{children}</div>;
}
