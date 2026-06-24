import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertTriangle, Loader2, Building2,
  MapPin, Star, Save, RotateCcw,
} from 'lucide-react';
import { subscribeToAllIssues, updateIssueStatus } from '@/lib/issues';
import { useAuth } from '@/hooks/useAuth';
import type { Issue, IssueStatus, IssueCategory } from '@/types/issue';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'urgencyScore' | 'createdAt' | 'communityScore';
type SortDir = 'asc' | 'desc';

const STATUS_FLOW: IssueStatus[] = [
  'submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'reopened',
];

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  reopened: 'Reopened',
  closed: 'Closed',
  rejected: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800 border-amber-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  assigned: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reopened: 'bg-orange-100 text-orange-800 border-orange-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const ALL_CATEGORIES: IssueCategory[] = [
  'pothole', 'drain', 'garbage', 'water_leak',
  'streetlight', 'broken_road', 'public_infra', 'other',
];

// ── Issue Row Component ───────────────────────────────────────────────────────

interface IssueRowProps {
  issue: Issue;
  onUpdated: () => void;
}

function IssueRow({ issue }: IssueRowProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus>(issue.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateIssueStatus(issue.id, newStatus, note, user.displayName || user.email || 'Authority');
      setSavedMsg('✓ Updated');
      setNote('');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (err) {
      console.error(err);
      setSavedMsg('✗ Failed');
    } finally {
      setSaving(false);
    }
  };

  const createdAgo = issue.createdAt
    ? (() => {
        try {
          const d = (issue.createdAt as any).seconds
            ? new Date((issue.createdAt as any).seconds * 1000)
            : new Date(issue.createdAt as unknown as string);
          const diff = Math.floor((Date.now() - d.getTime()) / 1000 / 60);
          if (diff < 60) return `${diff}m ago`;
          if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
          return `${Math.floor(diff / 1440)}d ago`;
        } catch { return 'recently'; }
      })()
    : 'recently';

  return (
    <div className="border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      {/* Summary row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer bg-card hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Image thumbnail */}
        {issue.imageURLs?.[0] ? (
          <img
            src={issue.imageURLs[0]}
            alt={issue.title}
            className="h-12 w-16 rounded-lg object-cover shrink-0 hidden sm:block"
          />
        ) : (
          <div className="h-12 w-16 rounded-lg bg-muted shrink-0 hidden sm:block" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate max-w-xs">{issue.title}</p>
            <Badge className={cn('text-[10px] border shrink-0', STATUS_COLORS[issue.status] ?? STATUS_COLORS.submitted)}>
              {STATUS_LABELS[issue.status] ?? issue.status}
            </Badge>
            {issue.aiSeverity && (
              <Badge className={cn('text-[10px] border shrink-0 capitalize', SEVERITY_COLORS[issue.aiSeverity])}>
                {issue.aiSeverity}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {issue.locality || issue.address || '—'}
            </span>
            <span className="capitalize">{issue.category?.replace(/_/g, ' ')}</span>
            <span>{createdAgo}</span>
          </div>
        </div>

        {/* Scores */}
        <div className="hidden md:flex items-center gap-4 shrink-0 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Urgency</p>
            <p className="font-bold text-sm">{issue.urgencyScore ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trust</p>
            <p className={cn('font-bold text-sm', (issue.communityScore ?? 0) < 0 ? 'text-destructive' : '')}>
              {(issue.communityScore ?? 0) > 0 ? '+' : ''}{issue.communityScore ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Confirms</p>
            <p className="font-bold text-sm">{issue.confirmations ?? 0}</p>
          </div>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t p-4 space-y-4 bg-muted/10 animate-fade-in">
          {/* Description & AI info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm leading-relaxed">{issue.description}</p>
              {issue.publicRisk && (
                <div className="mt-2 flex items-start gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{issue.publicRisk}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {issue.assignedDepartment && (
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-muted-foreground">Dept:</span>
                  <span className="font-medium">{issue.assignedDepartment}</span>
                </div>
              )}
              {issue.suggestedNextAction && (
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{issue.suggestedNextAction}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
                <span>Confirmations: {issue.confirmations ?? 0} · Fake: {issue.fakeReports ?? 0}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 mt-1"
                onClick={() => navigate(`/issue/${issue.id}`)}
              >
                View Full Issue
              </Button>
            </div>
          </div>

          {/* Status update */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold mb-3 uppercase tracking-wide text-muted-foreground">
              Update Status
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    newStatus === s
                      ? (STATUS_COLORS[s] ?? 'bg-primary/10 border-primary text-primary') + ' ring-2 ring-primary/30'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <textarea
              className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              rows={2}
              placeholder="Add authority note (optional)…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <div className="flex items-center gap-3 mt-2">
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm"
                onClick={handleSave}
                disabled={saving || newStatus === issue.status}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Saving…' : 'Update Status'}
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => { setNewStatus(issue.status); setNote(''); }}
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
              {savedMsg && (
                <span className={cn('text-xs font-medium', savedMsg.startsWith('✓') ? 'text-emerald-600' : 'text-destructive')}>
                  {savedMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Authority Dashboard Page ──────────────────────────────────────────────────

export default function AuthorityDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeToAllIssues((fetched) => {
      setIssues(fetched);
      setLoading(false);
    }, 200);
    return () => unsub();
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const filtered = useMemo(() => {
    let result = [...issues];
    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(i => i.category === filterCategory);
    if (filterSeverity !== 'all') result = result.filter(i => i.aiSeverity === filterSeverity);

    result.sort((a, b) => {
      let aVal: number;
      let bVal: number;
      if (sortKey === 'urgencyScore') {
        aVal = a.urgencyScore ?? 0;
        bVal = b.urgencyScore ?? 0;
      } else if (sortKey === 'communityScore') {
        aVal = a.communityScore ?? 0;
        bVal = b.communityScore ?? 0;
      } else {
        const aT = (a.createdAt as any)?.seconds ? (a.createdAt as any).seconds : 0;
        const bT = (b.createdAt as any)?.seconds ? (b.createdAt as any).seconds : 0;
        aVal = aT; bVal = bT;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [issues, filterStatus, filterCategory, filterSeverity, sortKey, sortDir]);

  // Summary stats
  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const critical = issues.filter(i => i.aiSeverity === 'critical' || i.aiSeverity === 'high').length;
  const verified = issues.filter(i => i.verificationStatus === 'community_verified').length;
  const aiAnalyzed = issues.filter(i => i.aiProcessed).length;

  const summaryStats = [
    { label: 'Total Issues', value: total, icon: Filter, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'AI Analyzed', value: aiAnalyzed, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: 'Verified', value: verified, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-500/10' },
    { label: 'High Priority', value: critical, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Pending', value: total - resolved, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  ];

  function SortButton({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
          active
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'border-border text-muted-foreground hover:bg-muted'
        )}
      >
        <ArrowUpDown className="h-3 w-3" />
        {label}
        {active && <span className="text-[10px]">{sortDir === 'desc' ? '↓' : '↑'}</span>}
      </button>
    );
  }

  return (
    <div className="py-4 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold md:text-3xl">Authority Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Demo authority panel · Review, filter, and update civic issue statuses
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700 bg-amber-50 text-[10px] px-2 py-1">
          DEMO MODE
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
        {summaryStats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-md">
              <CardContent className="p-3 md:p-4">
                <div className={cn('mb-2 inline-flex rounded-lg p-2', s.bg)}>
                  <Icon className={cn('h-4 w-4', s.color)} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter + Sort bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Filters</span>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Severity filter */}
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Severities</option>
              {['critical', 'high', 'medium', 'low'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <SortButton label="Date" k="createdAt" />
            <SortButton label="Urgency" k="urgencyScore" />
            <SortButton label="Trust Score" k="communityScore" />
            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} of {total} issues
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Issues list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading issues…</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Filter className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">No issues match filters</p>
            <button
              className="mt-3 text-xs text-primary hover:underline"
              onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setFilterSeverity('all'); }}
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(issue => (
            <IssueRow key={issue.id} issue={issue} onUpdated={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
