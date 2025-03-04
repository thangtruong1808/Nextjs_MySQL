import "@/app/ui/global.css";
import { ThemeProvider } from "next-themes";

import { inter } from "@/app/ui/fonts";
import Navbar from "./ui/navBar";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ThemeProvider attribute="class">
        <Navbar />
        <body className={`${inter.className} antialiased`}>{children}</body>
      </ThemeProvider>
    </html>
  );
}
