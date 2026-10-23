import { Noto_Sans_Ethiopic } from "next/font/google";
import { ToastHost } from "@/components/ui/Toast";
import "./globals.css";

const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "600", "700"],
  variable: "--font-ethiopic",
});

export const metadata = {
  title: "Awash Survey",
  description: "Motor damage survey · Awash Insurance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="am">
      <body className={`${ethiopic.variable} font-ethiopic`}>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}