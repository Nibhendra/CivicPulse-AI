import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 animate-fade-in">
      <div className="mb-6 rounded-2xl bg-muted p-5">
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </div>

      <h1 className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-7xl font-extrabold text-transparent">
        404
      </h1>

      <h2 className="mt-4 text-xl font-semibold">Page Not Found</h2>

      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Button asChild className="mt-8">
        <Link to="/">
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
