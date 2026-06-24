import { Link } from 'react-router-dom';
import { Clock, MapPin, Bot, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Issue } from '@/types/issue';
import { cn } from '@/lib/utils';

interface IssueCardProps {
  issue: Issue;
}

// ── Status styles ── matches ALL IssueStatus values including Phase 4
const statusStyles: Record<string, string> = {
  submitted:    'bg-amber-100 text-amber-800 border-amber-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned:     'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress:  'bg-indigo-100 text-indigo-800 border-indigo-200',
  resolved:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  reopened:     'bg-orange-100 text-orange-800 border-orange-200',
  closed:       'bg-gray-100 text-gray-700 border-gray-200',
  rejected:     'bg-red-100 text-red-800 border-red-200',
};

// ── Category colors ── must match the actual IssueCategory enum values
const categoryColors: Record<string, string> = {
  pothole:      'bg-stone-100 text-stone-700',
  drain:        'bg-cyan-100 text-cyan-700',
  garbage:      'bg-orange-100 text-orange-700',
  water_leak:   'bg-blue-100 text-blue-700',
  streetlight:  'bg-yellow-100 text-yellow-800',
  broken_road:  'bg-red-100 text-red-700',
  public_infra: 'bg-purple-100 text-purple-700',
  other:        'bg-gray-100 text-gray-700',
};

export function IssueCard({ issue }: IssueCardProps) {
  const timeAgo = () => {
    if (!issue.createdAt) return 'Just now';
    const dateObj = (issue.createdAt as any).toDate
      ? (issue.createdAt as any).toDate()
      : (issue.createdAt as any).seconds
        ? new Date((issue.createdAt as any).seconds * 1000)
        : new Date(issue.createdAt as unknown as string);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const status = issue.status ?? 'submitted';
  const category = issue.category ?? 'other';
  const statusLabel = status.replace(/_/g, ' ');
  const categoryLabel = category.replace(/_/g, ' ');

  const hasAI = issue.aiProcessed;
  const placeholder = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80';
  const imageSrc = issue.imageURLs?.find(u => u && u.trim()) || placeholder;

  return (
    <Link to={`/issue/${issue.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
      <Card className="overflow-hidden border-0 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 bg-white group cursor-pointer animate-in fade-in slide-in-from-bottom-4">
        {/* Image */}
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          <img
            src={imageSrc}
            alt={issue.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).src = placeholder; }}
          />
          {/* Status badge */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={cn('shadow-sm border font-medium capitalize', statusStyles[status] ?? statusStyles.submitted)}>
              {statusLabel}
            </Badge>
          </div>
          {/* AI badge */}
          {hasAI && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-indigo-600/90 text-white border-0 shadow-sm text-[10px] gap-1 flex items-center">
                <Bot className="h-2.5 w-2.5" /> AI
              </Badge>
            </div>
          )}
          {/* Community score badge */}
          {(issue.communityScore ?? 0) > 0 && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-emerald-600/90 text-white border-0 shadow-sm text-[10px] gap-1 flex items-center">
                <Shield className="h-2.5 w-2.5" /> +{issue.communityScore}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 relative">
          <div className="mb-2 flex items-center justify-between">
            <Badge
              variant="secondary"
              className={cn('text-[10px] font-semibold uppercase tracking-wider capitalize', categoryColors[category] ?? categoryColors.other)}
            >
              {categoryLabel}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground font-medium">
              <Clock className="mr-1 h-3 w-3" />
              {timeAgo()}
            </div>
          </div>

          <h3 className="mb-1 text-base font-bold leading-tight line-clamp-1">{issue.title || 'Untitled Issue'}</h3>

          {issue.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{issue.description}</p>
          )}

          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-primary/70" />
            <span className="line-clamp-1">{issue.address || issue.locality || 'Location captured'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
