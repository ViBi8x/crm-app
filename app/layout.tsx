// // app/layout.tsx
// import './globals.css'
// import type { Metadata } from "next"
// import { Inter } from "next/font/google"
// import ClientRootLayout from "./client-layout"

// const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "CRM Dashboard - Bảng điều khiển CRM",
//   description: "Modern CRM application for managing contacts and sales pipeline",
//   generator: 'v0.dev'
// }

// export default function RootLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <ClientRootLayout>
//           {children}
//         </ClientRootLayout>
//       </body>
//     </html>
//   )
// }

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/auth-provider';
import ClientRootLayout from './client-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Dashboard - Bảng điều khiển CRM',
  description: 'Modern CRM application for managing contacts and sales pipeline',
  generator: 'v0.dev',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ClientRootLayout>{children}</ClientRootLayout>
        </AuthProvider>
      </body>
    </html>
  );
}