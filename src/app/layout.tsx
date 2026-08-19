import type { Metadata } from 'next';
import './globals.css';
import { getPublicConfig } from '@/config/env';

const config = getPublicConfig();

export const metadata: Metadata = {
  title: {
    default: config.app.name,
    template: `%s | ${config.app.name}`,
  },
  description: 'Context-aware workflow automation platform for higher education institutions',
  keywords: ['workflow', 'automation', 'education', 'approval', 'document management'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
