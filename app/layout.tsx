import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: '내일은 의대생',
  description: 'Problem Solving Landing Page',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
