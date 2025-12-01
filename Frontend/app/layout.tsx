import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/toast";
import { Space_Grotesk } from "next/font/google";

const font = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WebMeet · Ultra-stable WebRTC classrooms",
  description:
    "Launch premium, ultra-low latency study sessions with crystal-clear audio & video.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={font.variable}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className="bg-black text-white antialiased">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
