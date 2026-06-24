import { useEffect, useState } from 'react';
import { ClipboardList, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToUserIssues } from '@/lib/issues';
import { IssueCard } from '@/components/ui/IssueCard';
import type { Issue } from '@/types/issue';
import { cn } from '@/lib/utils';

type FilterKey = 'All' | 'Submitted' | 'AI Analyzed' | 'Community Verified' | 'In Progress' | 'Resolved' | 'Disputed';

interface FilterDef {
  label: FilterKey;
  badgeClass: string;
  match: (issue: Issue) => boolean;
}

const FILTERS: FilterDef[] = [
  {
    label: 'All',
    badgeClass: '',
    match: () => true,
  },
  {
    label: 'Submitted',
    badgeClass: 'border-amber-300 bg-amber-50 text-amber-800',
    match: (i) => i.status === 'submitted' || i.status === 'under_review',
  },
  {
    label: 'AI Analyzed',
    badgeClass: 'border-indigo-300 bg-indigo-50 text-indigo-800',
    match: (i) => !!i.aiProcessed,
  },
  {
    label: 'Community Verified',
    badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    match: (i) => i.verificationStatus === 'community_verified',
  },
  {
    label: 'In Progress',
    badgeClass: 'border-blue-300 bg-blue-50 text-blue-800',
    match: (i) => i.status === 'assigned' || i.status === 'in_progress',
  },
  {
    label: 'Resolved',
    badgeClass: 'border-teal-300 bg-teal-50 text-teal-800',
    match: (i) => i.status === 'resolved' || i.status === 'closed' || i.verificationStatus === 'resolved_by_community',
  },
  {
    label: 'Disputed',
    badgeClass: 'border-red-300 bg-red-50 text-red-800',
    match: (i) => i.verificationStatus === 'disputed',
  },
];

export default function MyIssuesPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserIssues(user.uid, (fetchedIssues) => {
      setIssues(fetchedIssues);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const activeFilterDef = FILTERS.find(f => f.label === activeFilter) ?? FILTERS[0];
  const filteredIssues = issues.filter(activeFilterDef.match);

  const filterCount = (def: FilterDef) =>
    def.label === 'All' ? issues.length : issues.filter(def.match).length;

  return (
    <div className="py-4 animate-fade-in">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 md:text-3xl">
          <ClipboardList className="h-6 w-6 text-primary md:h-7 md:w-7" />
          My Issues
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Track all issues you have reported
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((filter) => {
          const count = filterCount(filter);
          const isActive = activeFilter === filter.label;
          return (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.label)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-150 shrink-0',
                isActive
                  ? filter.badgeClass || 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {filter.label}
              <span className={cn(
                'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                isActive ? 'bg-white/20' : 'bg-muted'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Issues Grid or Empty */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-48 rounded-xl bg-muted animate-pulse hidden sm:block" />
          <div className="h-48 rounded-xl bg-muted animate-pulse hidden lg:block" />
        </div>
      ) : filteredIssues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">No issues found</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground/70">
              {activeFilter === 'All'
                ? 'Issues you report will appear here so you can track their progress.'
                : `No issues matching "${activeFilter}".`}
            </p>
            {activeFilter === 'All' && (
              <Button asChild className="mt-6" size="sm">
                <Link to="/report">Report Your First Issue</Link>
              </Button>
            )}
            {activeFilter !== 'All' && (
              <button
                className="mt-4 text-xs text-primary hover:underline"
                onClick={() => setActiveFilter('All')}
              >
                Show all issues
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
