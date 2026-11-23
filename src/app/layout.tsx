import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BannerIN - Layanan Pemesanan Banner",
  description: "Layanan pemesanan banner custom online: pilih bahan, tentukan ukuran, upload desain, dan kalkulasi harga otomatis.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Filter out noise from browser extensions like MetaMask */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(event) {
                  var reason = event.reason;
                  var msg = (reason && reason.message) ? reason.message : String(reason || '');
                  var stack = (reason && reason.stack) ? reason.stack : '';
                  if (
                    msg.indexOf('MetaMask') !== -1 ||
                    stack.indexOf('chrome-extension://') !== -1 ||
                    stack.indexOf('moz-extension://') !== -1
                  ) {
                    event.preventDefault();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
