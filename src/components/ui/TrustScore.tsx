import { Shield, ThumbsUp, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Issue, VerificationStatus } from '@/types/issue';

const STATUS_CONFIG: Record<VerificationStatus, {
  label: string;
  badgeClass: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}> = {
  unverified: {
    label: 'Unverified',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Shield,
    description: 'No community votes yet',
  },
  community_verified: {
    label: 'Community Verified',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
    description: '3+ citizens confirmed this issue',
  },
  disputed: {
    label: 'Disputed',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertTriangle,
    description: 'Multiple citizens reported this as fake',
  },
  resolved_by_community: {
    label: 'Resolved by Community',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
    description: 'Community says this issue is fixed',
  },
};

interface Props {
  issue: Issue;
}

function ScoreBar({ value, max = 20 }: { value: number; max?: number }) {
  const normalised = Math.max(0, Math.min(100, ((value + max) / (max * 2)) * 100));
  const color = value >= 10 ? 'bg-emerald-500'
    : value >= 3  ? 'bg-blue-500'
    : value >= 0  ? 'bg-amber-400'
    : 'bg-red-500';

  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', color)}
        style={{ width: `${normalised}%` }}
      />
    </div>
  );
}

export function TrustScore({ issue }: Props) {
  const status = issue.verificationStatus ?? 'unverified';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const score = issue.communityScore ?? 0;

  const stats = [
    {
      label: 'Confirmations',
      value: issue.confirmations ?? 0,
      icon: ThumbsUp,
      color: 'text-emerald-600',
    },
    {
      label: 'Resolved marks',
      value: issue.resolvedReports ?? 0,
      icon: CheckCircle2,
      color: 'text-blue-600',
    },
    {
      label: 'Fake reports',
      value: issue.fakeReports ?? 0,
      icon: Flag,
      color: 'text-red-500',
    },
    {
      label: 'Duplicate marks',
      value: issue.duplicateReports ?? 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 shrink-0">
              <StatusIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-tight">Community Trust</p>
              <p className="text-sm font-semibold leading-tight">Trust Score</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-2xl font-bold tabular-nums', score >= 0 ? 'text-foreground' : 'text-destructive')}>
              {score > 0 ? '+' : ''}{score}
            </p>
          </div>
        </div>

        {/* Score bar */}
        <ScoreBar value={score} />

        {/* Verification status badge */}
        <Badge className={cn('text-[10px] border font-medium px-2 py-0.5', config.badgeClass)}>
          {config.label}
        </Badge>
        <p className="text-[11px] text-muted-foreground -mt-1.5">{config.description}</p>

        {/* Dispute warning */}
        {status === 'disputed' && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/50 p-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500 mt-0.5" />
            <p className="text-[11px] text-red-700 leading-tight">
              This issue has been flagged by multiple community members. Review carefully before acting.
            </p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <Icon className={cn('h-3 w-3 shrink-0', s.color)} />
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
                <span className="ml-auto text-xs font-semibold tabular-nums">{s.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
