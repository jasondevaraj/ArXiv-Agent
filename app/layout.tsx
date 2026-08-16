import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArXiv Digest Agent",
  description: "From hundreds of papers to a few meaningful research themes.",
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: 'any' },
      { url: '/icons/icon1.png', type: 'image/png' },
      { url: '/icons/icon0.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-icon.png' },
    ],
  },
  manifest: '/icons/manifest.json',
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
