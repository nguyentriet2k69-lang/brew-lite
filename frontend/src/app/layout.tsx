import type { Metadata } from "next";
import AuthHydrator from "@/app/components/AuthHydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite",
  description: "Chọn đồ uống, size và topping yêu thích.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthHydrator />
        {children}
      </body>
    </html>
  );
}
