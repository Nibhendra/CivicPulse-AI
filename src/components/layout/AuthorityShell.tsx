import { Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import AuthoritySidebar from '@/components/layout/AuthoritySidebar';

export default function AuthorityShell() {
  return (
    <div className="min-h-screen bg-slate-50 text-foreground">
      {/* Mobile-only: fixed top header */}
      <Header />

      {/* Desktop-only: fixed left sidebar */}
      <AuthoritySidebar />

      <main className="pt-14 lg:ml-64 lg:pt-0 lg:pb-0">
        {/* Desktop inner wrapper: centered with larger max-width for admin data density */}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* No bottom nav for authority shell - admins manage via sidebar or header on mobile */}
    </div>
  );
}
