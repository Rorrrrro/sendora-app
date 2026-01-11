import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sendora - Plateforme de Marketing Email",
  description: "Créez, gérez et analysez vos campagnes email facilement",
  generator: "v0.dev",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* Loader SVG global visible par défaut */}
        <div
          id="global-loader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* SVG du GlobalLoader */}
          <svg
            width="196.02158"
            height="362.73807"
            viewBox="-8 -8 212.02158 378.73807"
            xmlns="http://www.w3.org/2000/svg"
            overflow="visible"
          >
            <style>
              {`
                :root{
                  --stroke:#6c43e0;
                  --fill:#6c43e0;
                }
              `}
            </style>
            <defs>
              <path id="logoPath" d="m 445.25,172.73 c -1.2,3.73 -4.35,11.05 -6.99,16.27 -2.65,5.23 -7.47,13.32 -10.72,18 -3.44,4.95 -12.4,15 -21.47,24.06 -8.56,8.56 -22.77,21.89 -31.57,29.62 -8.8,7.73 -20.98,19.18 -27.07,25.44 -6.09,6.26 -13.23,14.31 -15.86,17.88 -2.63,3.57 -5.86,8.64 -7.18,11.25 -1.31,2.61 -3.09,7.34 -3.93,10.5 -0.91,3.36 -1.55,9.9 -1.56,15.75 0,6.96 0.64,12.43 2.1,18 1.15,4.4 3.53,10.7 5.29,14 1.77,3.31 7.01,9.97 11.71,14.86 l 8.5,8.86 c 1.99,-21.82 2.92,-26.36 5.11,-31.72 1.57,-3.85 4.55,-9.59 6.62,-12.75 2.07,-3.16 7.26,-9.4 11.52,-13.86 4.26,-4.46 13.12,-12.9 19.68,-18.75 6.57,-5.85 17.82,-15.98 25,-22.51 7.19,-6.52 15.73,-14.85 18.97,-18.5 3.25,-3.64 7.73,-9.33 9.95,-12.63 2.22,-3.3 5.96,-10.05 8.31,-15 2.34,-4.95 5.19,-12.6 6.31,-17 1.5,-5.83 2.05,-11.11 2.03,-19.5 -0.02,-7.38 -0.71,-14.72 -1.93,-20.5 -1.04,-4.95 -3.4,-13.24 -5.23,-18.43 -1.84,-5.19 -3.8,-9.58 -4.37,-9.77 -0.57,-0.18 -2.01,2.71 -3.22,6.43 z m 38.34,116.52 c -0.34,1.79 -0.62,6.18 -0.62,9.75 0,3.58 -0.68,9.65 -1.51,13.5 -0.83,3.85 -3.46,11.05 -5.83,16 -2.38,4.95 -6.53,11.92 -9.23,15.5 -2.69,3.57 -17.07,18.87 -31.95,34 -20.43,20.78 -28.61,29.82 -33.44,37 -3.51,5.23 -8.31,13.55 -10.66,18.5 -2.35,4.95 -5.2,12.6 -6.32,17 -1.48,5.75 -2.04,11.1 -2.02,19 0.02,6.05 0.49,14.15 1.05,18 0.56,3.85 2.59,11.73 4.52,17.5 1.93,5.77 4.95,13.55 6.72,17.28 1.76,3.73 3.54,6.77 3.95,6.75 0.41,-0.02 1.23,-1.94 1.81,-4.28 0.58,-2.34 1.55,-5.83 2.16,-7.75 0.61,-1.92 2.65,-6.87 4.53,-11 1.89,-4.12 5.81,-11.55 8.72,-16.5 2.91,-4.95 8.12,-12.82 11.58,-17.5 3.46,-4.67 18.95,-21.32 34.42,-37 23.66,-23.96 29.31,-30.25 35.45,-39.5 4.01,-6.05 9.03,-14.6 11.15,-19 2.12,-4.4 4.6,-10.92 5.51,-14.5 1.26,-4.95 1.55,-9.48 1.21,-19 -0.38,-10.78 -0.89,-13.81 -3.69,-22 -2.01,-5.86 -4.9,-11.8 -7.56,-15.5 -2.37,-3.3 -7.06,-9.04 -10.43,-12.75 -3.36,-3.71 -6.74,-6.75 -7.5,-6.75 -0.78,0 -1.67,1.43 -2.02,3.25 z" />
              <clipPath id="clipLogo">
                <use href="#logoPath" transform="translate(-318.9,-166.29203)"/>
              </clipPath>
            </defs>
            <g clipPath="url(#clipLogo)">
              <g transform="translate(0 430)">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  dur="6s"
                  repeatCount="indefinite"
                  values="0 430; 0 -340; 0 -340; 0 430"
                  keyTimes="0; 0.6; 0.85; 1"
                />
                <path
                  fill="var(--fill)"
                  d="M -220 240
                    C -110 205, 0 275, 110 240
                    C 220 205, 330 275, 440 240
                    L 440 900
                    L -220 900 Z">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    dur="1.8s"
                    repeatCount="indefinite"
                    values="-140 0; 0 0; -140 0"
                  />
                </path>
                <rect x="-600" y="240" width="2000" height="2000" fill="var(--fill)"/>
              </g>
            </g>
            <use
              href="#logoPath"
              transform="translate(-318.9,-166.29203)"
              fill="none"
              stroke="var(--stroke)"
              strokeWidth="4"
              strokeLinejoin="miter"
              strokeMiterlimit="40"
              strokeLinecap="butt"
            />
          </svg>
        </div>
        {/* Script pour masquer le loader dès que React est prêt */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.addEventListener('DOMContentLoaded',function(){
              var loader=document.getElementById('global-loader');
              if(loader) loader.style.display='none';
            });
          `,
          }}
        />
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
