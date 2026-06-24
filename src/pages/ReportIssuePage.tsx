import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IssueForm } from '@/components/ui/IssueForm';

export default function ReportIssuePage() {
  return (
    <div className="py-4 animate-fade-in">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 md:text-3xl">
            <FileText className="h-6 w-6 text-primary md:h-7 md:w-7" />
            Report an Issue
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Help your community by reporting a civic problem
          </p>
        </div>
      </div>

      {/* Form — full width on mobile, centered card with max-width on desktop */}
      <div className="mx-auto w-full max-w-2xl">
        <Card className="border-0 shadow-none md:border md:shadow-md">
          <CardContent className="p-0 md:p-6">
            <IssueForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
