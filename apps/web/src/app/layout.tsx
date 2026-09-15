import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Save",
  description: "Save anything you find online and let it resurface when it matters.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Feed</Link>
          <Link href="/save">Save</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
