import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArXiv Digest Agent",
  description: "From hundreds of papers to a few meaningful research themes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ backgroundColor: '#faf9f7' }}>
        {children}
      </body>
    </html>
  );
}
