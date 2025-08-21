import type { Metadata } from "next";
import "../index.css";
import { Toaster } from '@car-booking/ui'

export const metadata: Metadata = {
  title: "Car Booking System",
  description: "Car Booking System - Next.js 15 Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
