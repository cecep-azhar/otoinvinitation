import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSVP - BASNOM HIPMI OTOMOTIF JABAR",
  description:
    "Konfirmasi kehadiran Anda untuk acara Ceremonial, Talkshow & Buka Bersama BASNOM HIPMI OTOMOTIF JAWA BARAT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-gray-200 font-inter antialiased flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="py-4 text-center">
          <p className="text-xs text-gray-700">
            Dibuat dengan ♥ di Bandung, Indonesia —{" "}
            <a
              href="https://cecepazhar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-700 hover:text-yellow-500 transition font-medium"
            >
              Cecep Azhar
            </a>{" "}
            © {new Date().getFullYear()}
          </p>
        </footer>
      </body>

    </html>
  );
}
