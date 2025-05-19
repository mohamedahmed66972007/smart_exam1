import { ReactNode } from "react";
import NavBar from "./NavBar";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-900">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
