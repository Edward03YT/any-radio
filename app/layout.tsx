import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AnyRadio Code Recovery — Recuperare Cod Radio Auto OEM',
  description:
    'Recuperare instantanee a codului radio dupa deconectarea bateriei pe baza seriei unitatii. Suport verificat pentru Renault, Dacia, Ford, Toyota, Fiat, PSA, GM, Chrysler.',
  keywords: [
    'cod radio auto',
    'renault precode',
    'ford radio code M',
    'toyota erc calculator',
    'deblocare casetofon auto',
    'radio code generator',
  ],
  other: {
    'color-scheme': 'dark',
    'darkreader-lock': 'true',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="dark" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body
        className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
