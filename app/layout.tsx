import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { META_PIXEL_ID } from "@/lib/meta";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Skin Studio | Harley Street Aesthetics",
  description:
    "A luminous AI skin consultation — an in-depth analysis, a professional treatment map, and a preview of your results with the Veluria skin booster.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <head>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');`}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </head>
      <body>
        <div className="atmosphere">
          {/* living gradient mesh — gold / champagne / cream */}
          <div
            className="orb animate-mesh-shift animate-blob-morph"
            style={{
              top: "-12%",
              right: "-8%",
              width: "46vmax",
              height: "46vmax",
              background:
                "radial-gradient(circle at 50% 50%, #f0e2b6, #d9bd72 55%, transparent 72%)",
            }}
          />
          <div
            className="orb animate-mesh-shift-slow animate-blob-morph"
            style={{
              bottom: "-18%",
              left: "-10%",
              width: "44vmax",
              height: "44vmax",
              background:
                "radial-gradient(circle at 50% 50%, #e7c970, #efdcab 50%, transparent 70%)",
            }}
          />
          <div
            className="orb animate-mesh-shift"
            style={{
              top: "30%",
              left: "30%",
              width: "30vmax",
              height: "30vmax",
              opacity: 0.45,
              background:
                "radial-gradient(circle at 50% 50%, #e8ddc4, transparent 68%)",
            }}
          />
          {/* glossy floating serum droplets */}
          <div
            className="orb-gloss animate-float"
            style={{ top: "16%", left: "12%", width: "120px", height: "120px" }}
          />
          <div
            className="orb-gloss animate-float-slow"
            style={{ top: "62%", right: "14%", width: "90px", height: "90px" }}
          />
          <div
            className="orb-gloss animate-float"
            style={{ top: "40%", right: "30%", width: "60px", height: "60px" }}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
