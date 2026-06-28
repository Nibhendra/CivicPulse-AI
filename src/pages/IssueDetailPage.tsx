import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, User, ThumbsUp, MessageSquare, Tag,
  Bot, RefreshCw, Copy, Check, AlertTriangle, Building2, Zap,
  Shield, ChevronDown, ChevronUp,
} from 'lucide-react';
import { subscribeToIssue, toggleUpvote, updateIssueAIResults, getRecentIssuesForDuplicateCheck, subscribeToComments, addComment } from '@/lib/issues';
import { processIssue, checkServerHealth } from '@/lib/api';
import type { Issue } from '@/types/issue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AgentStatus } from '@/components/ui/AgentStatus';
import { CommunityVerification } from '@/components/ui/CommunityVerification';
import { TrustScore } from '@/components/ui/TrustScore';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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

const severityStyles: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

type AgentState = 'idle' | 'running' | 'done' | 'error';

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  // Agent state
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [agentError, setAgentError] = useState<string | null>(null);
  const [showRerunWarning, setShowRerunWarning] = useState(false);

  // Server health
  const [serverReady, setServerReady] = useState<boolean | null>(null); // null = checking
  const isProduction = import.meta.env.PROD;

  // UI state
  const [copiedComplaint, setCopiedComplaint] = useState(false);
  const [complaintExpanded, setComplaintExpanded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToIssue(id, (fetchedIssue) => {
      setIssue(fetchedIssue);
      setLoading(false);
      // If already processed and agent is idle, keep idle so Re-run button shows
      // Do NOT auto-set to 'done' â€” that hides the Re-run button
    });
    return () => unsubscribe();
  }, [id]);

  // Check if the Express server is running (once on mount)
  useEffect(() => {
    checkServerHealth().then(setServerReady);
  }, []);

  // â”€â”€ Comments State & Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToComments(id, (fetchedComments) => {
      setComments(fetchedComments);
    });
    return () => unsubscribe();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      await addComment(id, newComment);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUpvote = async () => {
    if (!id) return;
    try { await toggleUpvote(id); }
    catch (error) { console.error('Failed to upvote:', error); }
  };

  const runAgent = useCallback(async () => {
    if (!issue || !id || !user) return;

    setAgentState('running');
    setAgentError(null);
    setShowRerunWarning(false);

    try {
      const nearbyIssues = await getRecentIssuesForDuplicateCheck(issue.category, id);

      const result = await processIssue({
        issueId: id,
        imageURL: issue.imageURLs?.[0] ?? '',
        title: issue.title,
        description: issue.description,
        category: issue.category,
        latitude: issue.latitude,
        longitude: issue.longitude,
        address: issue.address,
        locality: issue.locality,
        nearbyIssues,
      });

      if (!result.success) {
        throw new Error(result.error ?? 'Analysis failed');
      }

      // Small delay so user sees the "Saving AI results" step
      await new Promise((r) => setTimeout(r, 800));

      await updateIssueAIResults(id, result.analysis);
      setAgentState('done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      setAgentError(msg);
      setAgentState('error');
    }
  }, [issue, id, user]);

  const copyComplaint = async () => {
    if (!issue?.formalComplaint) return;
    try {
      await navigator.clipboard.writeText(issue.formalComplaint);
      setCopiedComplaint(true);
      setTimeout(() => setCopiedComplaint(false), 2500);
    } catch {
      // fallback for browsers without clipboard API
    }
  };

  // â”€â”€ Loading / Not Found â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Issue Not Found</h2>
        <p className="text-muted-foreground mb-6">This issue does not exist or has been removed.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const hasUpvoted = user ? (issue.upvoterIds || []).includes(user.uid) : false;
  const isOwner = user?.uid === issue.reporterId;

  const createdAgo = issue.createdAt
    ? formatDistanceToNow(
        (issue.createdAt as any).seconds
          ? new Date((issue.createdAt as any).seconds * 1000)
          : new Date(issue.createdAt),
        { addSuffix: true }
      )
    : 'Just now';

  const severityStyle = issue.aiSeverity ? severityStyles[issue.aiSeverity] ?? severityStyles.medium : null;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9 rounded-full" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold truncate md:text-2xl">Issue Details</h1>
      </div>

      {/*
        Mobile: single column stack
        Desktop (md+): 3/5 left, 2/5 right
      */}
      <div className="md:grid md:grid-cols-5 md:gap-6 lg:gap-8">

        {/* â”€â”€ LEFT COLUMN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="md:col-span-3 space-y-6">

          {/* Image */}
          {issue.imageURLs && issue.imageURLs.length > 0 ? (
            <div className="w-full overflow-hidden rounded-2xl bg-muted shadow-md">
              <img
                src={issue.imageURLs[0]}
                alt={issue.title}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          ) : (
            <div className="flex h-48 w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground text-sm md:h-64">
              No image provided
            </div>
          )}

          {/* Title + Status */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <h2 className="text-2xl font-bold md:text-3xl">{issue.title}</h2>
              <Badge className={`capitalize whitespace-nowrap border font-medium ${statusStyles[issue.status] ?? statusStyles['submitted']}`}>
                {issue.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{issue.description}</p>
          </div>

          {/* â”€â”€ AI Analysis Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold">Civic Rescue Agent</h3>
              {issue.aiProcessed && (
                <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
                  Analysed
                </Badge>
              )}
            </div>

            {/* Run button â€” show if not yet processed and user is owner */}
            {!issue.aiProcessed && agentState === 'idle' && isOwner && (
              <div className="space-y-3">
                {/* Server not running warning */}
                {serverReady === false && (
                  <Card className="border-red-200 bg-red-50/60">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-red-800">AI Service Unavailable</p>
                        {isProduction ? (
                          <p className="text-xs text-red-700 mt-1">
                            The deployed AI API is not responding. Please retry, or ask the project owner to check Vercel environment variables and redeploy.
                          </p>
                        ) : (
                          <>
                            <p className="text-xs text-red-700 mt-1">
                              The Express API server is offline. Open a <strong>new terminal</strong> in the project folder and run:
                            </p>
                            <code className="mt-2 block text-xs bg-red-100 border border-red-200 rounded px-2.5 py-1.5 font-mono text-red-900 select-all">
                              npm run server
                            </code>
                          </>
                        )}
                        <button
                          className="mt-2 text-xs text-red-600 underline"
                          onClick={() => checkServerHealth().then(setServerReady)}
                        >
                          Re-check server status
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-dashed border-indigo-200 bg-indigo-50/40">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-sm">Run AI Analysis</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gemini will analyse the image and details to assess severity, assign a department, check duplicates, and draft a formal complaint.
                        </p>
                      </div>
                      <Button
                        onClick={runAgent}
                        disabled={serverReady === false}
                        className="shrink-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        size="sm"
                      >
                        <Bot className="mr-2 h-4 w-4" />
                        Run Civic Rescue Agent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Not owner â€” view only note */}
            {!issue.aiProcessed && agentState === 'idle' && !isOwner && (
              <p className="text-sm text-muted-foreground italic">
                AI analysis has not been run yet. Only the issue reporter can trigger it.
              </p>
            )}


            {/* Agent progress */}
            {(agentState === 'running' || agentState === 'error') && (
              <AgentStatus isComplete={false} error={agentState === 'error' ? agentError : null} />
            )}

            {/* AI result cards â€” shown once aiProcessed is true */}
            {issue.aiProcessed && (
              <div className="space-y-4 animate-fade-in">

                {/* Duplicate warning */}
                {issue.isDuplicate && issue.duplicateOf && (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-amber-800">Possible Duplicate Detected</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          This issue may overlap with a nearby report (score: {issue.duplicateScore}/100). Consider viewing the existing issue before escalating.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Severity + Urgency row */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Shield className="h-3.5 w-3.5" /> Severity
                      </p>
                      {severityStyle && (
                        <Badge className={`capitalize border font-semibold text-sm ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}>
                          {issue.aiSeverity}
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Score: {issue.severityScore ?? 'â€”'}/10
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" /> Urgency
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {issue.urgencyScore ?? 'â€”'}<span className="text-sm text-muted-foreground font-normal">/10</span>
                      </p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        Priority: {issue.priorityLevel ?? 'â€”'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Department + Next Action */}
                <Card className="border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Recommended Department</p>
                        <p className="font-semibold text-sm">{issue.assignedDepartment ?? 'â€”'}</p>
                      </div>
                    </div>
                    {issue.suggestedNextAction && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <Zap className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Suggested Next Action</p>
                          <p className="font-medium text-sm">{issue.suggestedNextAction}</p>
                        </div>
                      </div>
                    )}
                    {issue.publicRisk && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Public Risk</p>
                          <p className="font-medium text-sm">{issue.publicRisk}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Formal complaint */}
                {issue.formalComplaint && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-sm">Formal Complaint Draft</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={copyComplaint}
                          >
                            {copiedComplaint ? (
                              <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3" /> Copy</>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setComplaintExpanded((v) => !v)}
                          >
                            {complaintExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300 text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/40 rounded-lg p-3',
                          complaintExpanded ? 'max-h-[600px]' : 'max-h-32'
                        )}
                      >
                        {issue.formalComplaint}
                      </div>
                      {!complaintExpanded && (
                        <button
                          className="mt-1 text-xs text-primary hover:underline"
                          onClick={() => setComplaintExpanded(true)}
                        >
                          Show full complaint
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Confidence + AI category */}
                <p className="text-xs text-muted-foreground text-center">
                  AI Category: <span className="font-medium capitalize">{(issue.aiCategory ?? issue.category).replace(/_/g, ' ')}</span>
                  {' \u00b7 '}
                  Confidence: <span className="font-medium">{issue.aiConfidence != null ? `${Math.round(issue.aiConfidence)}%` : '\u2014'}</span>
                </p>

                {/* Re-run button â€” only for issue owner */}
                {isOwner && (
                  <div className="pt-1">
                    {showRerunWarning ? (
                      <Card className="border-amber-200 bg-amber-50/40">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-amber-800 mb-3">
                            âš  Re-running analysis will consume Gemini API quota. The previous results will be overwritten.
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="destructive" className="text-xs h-7" onClick={runAgent}>
                              Proceed
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowRerunWarning(false)}>
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-2 text-muted-foreground"
                        onClick={() => setShowRerunWarning(true)}
                        disabled={agentState === 'running'}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Re-run AI Analysis
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          {(issue.timeline || []).length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 text-lg">Timeline</h3>
              <div className="space-y-4">
                {[...(issue.timeline || [])].reverse().map((entry, idx, arr) => {
                  const ts = entry.timestamp
                    ? (() => {
                        try {
                          const d = (entry.timestamp as any).seconds
                            ? new Date((entry.timestamp as any).seconds * 1000)
                            : new Date(entry.timestamp as string);
                          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
                            ' \u00b7 ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                        } catch { return ''; }
                      })()
                    : '';
                  return (
                    <div key={entry.id || idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        {idx !== arr.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium capitalize">{entry.status.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">{entry.note}</p>
                        {ts && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{ts}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments section */}
          <div ref={commentsSectionRef} className="pt-2">
            <Card className="border shadow-sm">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Comments ({comments.length})
                </h3>

                {/* Comment input form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={submittingComment}
                    maxLength={500}
                  />
                  <Button type="submit" disabled={!newComment.trim() || submittingComment} size="sm">
                    {submittingComment ? 'Sending...' : 'Send'}
                  </Button>
                </form>

                {/* Comments list */}
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {comments.length > 0 ? (
                    [...comments].reverse().map((comment) => {
                      const time = comment.createdAt
                        ? (() => {
                            try {
                              const d = comment.createdAt.seconds
                                ? new Date(comment.createdAt.seconds * 1000)
                                : new Date(comment.createdAt);
                              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' \u00b7 ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                            } catch { return ''; }
                          })()
                        : '';
                      return (
                        <div key={comment.id} className="bg-muted/30 rounded-xl p-3 text-sm flex flex-col gap-1 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-slate-800">{comment.userName}</span>
                            <span className="text-[10px] text-muted-foreground">{time}</span>
                          </div>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-6">No comments yet. Start the conversation!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* â”€â”€ RIGHT COLUMN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mt-6 md:col-span-2 md:mt-0 space-y-4">

          {/* Metadata card */}
          <Card className="border shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-base mb-1">Details</h3>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reported by</p>
                  <p className="font-medium truncate">{issue.reporterName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reported</p>
                  <p className="font-medium">{createdAgo}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium truncate">{issue.address || issue.locality || 'Location recorded'}</p>
                  {issue.latitude && issue.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>

              {issue.category && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-medium capitalize">{issue.category.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Score */}
          <TrustScore issue={issue} />

          {/* Community Verification */}
          {user && (
            isOwner ? (
              <Card className="border shadow-sm bg-indigo-50/50 border-indigo-100">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-indigo-100 p-1.5 shrink-0">
                    <Shield className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-900">Your Report</h4>
                    <p className="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
                      You reported this issue. Other citizens can verify and confirm it to boost its priority.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <CommunityVerification issue={issue} userId={user.uid} />
            )
          )}

          {/* Actions card */}
          <Card className="border shadow-sm">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold text-base mb-1">Actions</h3>
              <Button
                variant={hasUpvoted ? 'default' : 'outline'}
                className="w-full gap-2"
                onClick={handleUpvote}
                disabled={isOwner}
              >
                <ThumbsUp className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''}`} />
                {isOwner ? 'Own issue' : `${issue.upvotes || 0} ${issue.upvotes === 1 ? 'Upvote' : 'Upvotes'}`}
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={scrollToComments}>
                <MessageSquare className="h-4 w-4" />
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
