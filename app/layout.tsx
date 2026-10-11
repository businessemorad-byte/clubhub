import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClubHub | Internal Workspace",
  description: "Internal workspace & management platform for student club leadership and members",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#313338] text-[#dbdee1] antialiased select-text">
        {children}
      </body>
    </html>
  );
}
