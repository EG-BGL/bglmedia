import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, hideFooter }: { children: ReactNode; hideFooter?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
