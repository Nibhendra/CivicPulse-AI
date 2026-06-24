import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile-only: fixed top header */}
      <Header />

      {/* Desktop-only: fixed left sidebar */}
      <DesktopSidebar />

      <main className="pt-14 pb-20 lg:ml-64 lg:pt-0 lg:pb-0">
        {/* Desktop inner wrapper: centered with larger max-width to use screen effectively without huge gap after sidebar */}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile-only: fixed bottom navigation */}
      <BottomNav />
    </div>
  );
}
