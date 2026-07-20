import "./globals.css";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-plex-mono" });
export const metadata: Metadata = { title: "Discovery Engine", description: "Local SAP presales discovery workspace" };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body className={`${plexSans.variable} ${plexMono.variable} font-sans`}>{children}</body></html>; }
