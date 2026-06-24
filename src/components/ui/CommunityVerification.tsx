import { useState } from 'react';
import { ThumbsUp, Flag, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Issue } from '@/types/issue';
import {
  confirmIssue, unconfirmIssue,
  markIssueFake, unmarkIssueFake,
  markIssueResolvedByCommunity, unmarkIssueResolvedByCommunity,
  markIssueDuplicate, unmarkIssueDuplicate,
} from '@/lib/issues';

interface Props {
  issue: Issue;
  userId: string;
}

type ActionKey = 'confirm' | 'fake' | 'resolved' | 'duplicate';

export function CommunityVerification({ issue, userId }: Props) {
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isReporter = issue.reporterId === userId;

  const hasConfirmed = (issue.confirmedBy || []).includes(userId);
  const hasFaked = (issue.fakeReportedBy || []).includes(userId);
  const hasResolved = (issue.resolvedBy || []).includes(userId);
  const hasDuplicated = (issue.duplicateReportedBy || []).includes(userId);

  async function handle(key: ActionKey, fn: () => Promise<void>) {
    setLoading(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(null);
    }
  }

  const actions = [
    {
      key: 'confirm' as ActionKey,
      label: 'Confirm',
      activeLabel: 'Confirmed',
      icon: ThumbsUp,
      count: issue.confirmations ?? 0,
      active: hasConfirmed,
      disabled: isReporter,
      disabledReason: 'You cannot confirm your own issue',
      activeClass: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200',
      inactiveClass: 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700',
      fn: () => hasConfirmed
        ? unconfirmIssue(issue.id)
        : confirmIssue(issue.id),
    },
    {
      key: 'resolved' as ActionKey,
      label: 'Mark Resolved',
      activeLabel: 'Resolved ✓',
      icon: CheckCircle2,
      count: issue.resolvedReports ?? 0,
      active: hasResolved,
      disabled: false,
      disabledReason: '',
      activeClass: 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200',
      inactiveClass: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700',
      fn: () => hasResolved
        ? unmarkIssueResolvedByCommunity(issue.id)
        : markIssueResolvedByCommunity(issue.id),
    },
    {
      key: 'duplicate' as ActionKey,
      label: 'Duplicate',
      activeLabel: 'Marked Duplicate',
      icon: Copy,
      count: issue.duplicateReports ?? 0,
      active: hasDuplicated,
      disabled: false,
      disabledReason: '',
      activeClass: 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200',
      inactiveClass: 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700',
      fn: () => hasDuplicated
        ? unmarkIssueDuplicate(issue.id)
        : markIssueDuplicate(issue.id),
    },
    {
      key: 'fake' as ActionKey,
      label: 'Report Fake',
      activeLabel: 'Reported Fake',
      icon: Flag,
      count: issue.fakeReports ?? 0,
      active: hasFaked,
      disabled: false,
      disabledReason: '',
      activeClass: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200',
      inactiveClass: 'hover:bg-red-50 hover:border-red-200 hover:text-red-700',
      fn: () => hasFaked
        ? unmarkIssueFake(issue.id)
        : markIssueFake(issue.id),
    },
  ];

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <p className="font-semibold text-sm">Community Verification</p>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Click to vote · click again to undo
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            const isLoading = loading === action.key;

            return (
              <button
                key={action.key}
                disabled={action.disabled || isLoading}
                onClick={() => handle(action.key, action.fn)}
                title={action.disabled ? action.disabledReason : undefined}
                className={cn(
                  'relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed',
                  action.active
                    ? action.activeClass
                    : cn('border-border text-muted-foreground bg-background', action.inactiveClass)
                )}
              >
                {isLoading
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  : <Icon className="h-3.5 w-3.5 shrink-0" />
                }
                <span className="leading-tight">
                  {action.active ? action.activeLabel : action.label}
                </span>
                {action.count > 0 && (
                  <span className="ml-auto font-bold tabular-nums">{action.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}

        {isReporter && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            You reported this issue. Other citizens can verify it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
