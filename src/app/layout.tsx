import localFont from "next/font/local";
import { ToastHost } from "@/components/ui/Toast";
import { Providers } from "./providers";
import "./globals.css";

const ethiopic = localFont({
  src: [
    {
      path: "../../public/fonts/NotoSansEthiopic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/NotoSansEthiopic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-ethiopic",
  display: "swap",
});

export const metadata = {
  title: "Awash Survey",
  description: "Motor damage survey · Awash Insurance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am" suppressHydrationWarning>
      <body className={`${ethiopic.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
        <ToastHost />
      </body>
    </html>
  );
}