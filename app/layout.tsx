import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mawsool | Genesys Performance Hub",
  description: "Real-time MOS and Traffic monitoring for Genesys Cloud UAE.",
};

export default function RootLayout({
  children,
}: {
  // Fix: Added React import to resolve the 'React' namespace for ReactNode
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" async></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" async></script>
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 font-['Inter']">
        {children}
      </body>
    </html>
  );
}