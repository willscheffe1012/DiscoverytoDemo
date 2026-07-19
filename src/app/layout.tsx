import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Discovery Engine", description: "Local SAP presales discovery workspace" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
