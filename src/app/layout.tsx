// import type { Metadata } from 'next';
// import { Geist, Geist_Mono } from 'next/font/google';
// import './globals.css';

// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
// });

// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

// export const metadata: Metadata = {
//   title: 'Health Assistant App',
//   description: 'An AI health assistant powered by Gemini + MongoDB',
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body
//         className={`
//           ${geistSans.variable}
//           ${geistMono.variable}
//           antialiased
//           min-h-screen
//           bg-gradient-to-b
//           from-white
//           to-green-100
//           text-black
//         `}
//       >
//         <main className="flex flex-col items-center justify-center min-h-screen">
//           {children}
//         </main>
//       </body>
//     </html>
//   );
// }
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Use Inter and Roboto_Mono as alternatives to Geist and Geist_Mono
const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Assistant App",
  description: "An AI health assistant powered by Gemini + MongoDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          min-h-screen 
          bg-gradient-to-b 
          from-white 
          to-green-100 
          text-black
        `}
      >
        <main className="flex flex-col items-center justify-center min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
