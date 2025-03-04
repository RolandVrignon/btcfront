"use client";

import { ReactNode } from 'react';

interface AppProps {
  children: ReactNode;
}

export default function App({ children }: AppProps) {
  // Votre logique d'application ici
  return (
    <div className="app-container">
      {children}
    </div>
  );
}
