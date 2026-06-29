import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  CheckCircle2, Clock, AlertTriangle, Loader2, Building2,
  MapPin, Star, Save, RotateCcw, Search,
} from 'lucide-react';
import { subscribeToAllIssues, updateAuthorityCase } from '@/lib/issues';
import { useAuth } from '@/hooks/useAuth';
import type { Issue, IssueStatus, IssueCategory } from '@/types/issue';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare const L: any;

const categories = [
  { value: 'pothole', label: 'Road / Pothole', color: 'bg-red-500', hex: '#ef4444' },
  { value: 'broken_road', label: 'Broken Road', color: 'bg-orange-500', hex: '#f97316' },
  { value: 'drain', label: 'Water & Drainage', color: 'bg-amber-500', hex: '#f59e0b' },
  { value: 'water_leak', label: 'Water Leakage', color: 'bg-blue-500', hex: '#3b82f6' },
  { value: 'garbage', label: 'Garbage / Waste', color: 'bg-green-500', hex: '#22c55e' },
  { value: 'streetlight', label: 'Street Lighting', color: 'bg-yellow-500', hex: '#eab308' },
  { value: 'public_infra', label: 'Public Infrastructure', color: 'bg-purple-500', hex: '#a855f7' },
  { value: 'other', label: 'Other', color: 'bg-slate-500', hex: '#64748b' },
];

// Types

type SortKey = 'urgencyScore' | 'createdAt' | 'communityScore';
type SortDir = 'asc' | 'desc';

const STATUS_FLOW: IssueStatus[] = [
  'submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected', 'reopened'
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

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Water Supply',
  'Drainage',
  'Street Lighting',
  'Public Works',
  'Parks & Public Spaces',
  'Other / General Administration'
];

function toIssueDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const seconds = Number((value as { seconds: unknown }).seconds);
      if (!Number.isNaN(seconds)) return new Date(seconds * 1000);
    }
    const date = value instanceof Date ? value : new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function formatTimelineDate(timestamp: unknown): string {
  const date = toIssueDate(timestamp);
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'recently';
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function formatVerificationStatus(status: Issue['verificationStatus'] | undefined | null): string {
  return (status || 'unverified').replace(/_/g, ' ');
}

// Helpers

function isOverdue(issue: Issue) {
  if (issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'rejected') return false;
  if (!issue.createdAt) return false;
  const createdDate = toIssueDate(issue.createdAt);
  if (!createdDate) return false;

  const diffHours = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
  return diffHours > 24;
}

function needsAttention(issue: Issue) {
  if (issue.status === 'resolved' || issue.status === 'closed' || issue.status === 'rejected') return false;
  if (issue.aiSeverity === 'critical' || issue.aiSeverity === 'high') return true;
  return isOverdue(issue);
}

// Issue Row Component

interface IssueRowProps {
  issue: Issue;
  onUpdated: () => void;
}

function IssueRow({ issue }: IssueRowProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState<IssueStatus>(issue.status);
  const [department, setDepartment] = useState<string>(issue.assignedDepartment || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const hasChanges = newStatus !== issue.status || department !== (issue.assignedDepartment || '') || note.trim().length > 0;

  const isTerminal = ['resolved', 'closed', 'rejected'].includes(issue.status);
  
  const isStatusDisabled = (s: IssueStatus) => {
    if (isTerminal) {
      return ['submitted', 'under_review', 'assigned', 'in_progress'].includes(s);
    }
    return false;
  };

  const handleSave = async () => {
    if (!user || !hasChanges) return;

    if (newStatus !== issue.status) {
      const confirmChange = window.confirm(
        `Are you sure you want to change the status of this issue from "${STATUS_LABELS[issue.status]}" to "${STATUS_LABELS[newStatus]}"?\n\nOnce marked as resolved, closed, or rejected, the status cannot be reverted to earlier stages (like in-progress or assigned).`
      );
      if (!confirmChange) return;
    }

    setSaving(true);
    try {
      await updateAuthorityCase(issue.id, {
        status: newStatus,
        assignedDepartment: department,
        note: note.trim(),
        updatedByName: user.displayName || user.email || 'Authority'
      });
      setSavedMsg('Updated');
      setNote('');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (err) {
      console.error(err);
      setSavedMsg('Failed');
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

  const isAttention = needsAttention(issue);
  const isOver = isOverdue(issue);

  return (
    <div className={cn("border rounded-xl overflow-hidden transition-shadow hover:shadow-md", isAttention ? "border-amber-200" : "")}>
      {/* Summary row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer bg-card hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Image thumbnail */}
        {issue.imageURLs?.[0] ? (
          <img
            src={issue.imageURLs[0]}
            alt={safeText(issue.title, 'Issue photo')}
            className="h-12 w-16 rounded-lg object-cover shrink-0 hidden sm:block"
          />
        ) : (
          <div className="h-12 w-16 rounded-lg bg-muted shrink-0 hidden sm:block" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <p className="font-semibold text-sm truncate max-w-xs">{safeText(issue.title, 'Untitled case')}</p>
            <Badge className={cn('text-[10px] border shrink-0', STATUS_COLORS[issue.status] ?? STATUS_COLORS.submitted)}>
              {STATUS_LABELS[issue.status] ?? issue.status}
            </Badge>
            {issue.aiSeverity && (
              <Badge className={cn('text-[10px] border shrink-0 capitalize', SEVERITY_COLORS[issue.aiSeverity])}>
                {issue.aiSeverity}
              </Badge>
            )}
            {isAttention && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] shrink-0">
                Needs Attention
              </Badge>
            )}
            {!issue.aiProcessed && (
              <Badge variant="outline" className="text-[10px] shrink-0 text-muted-foreground">
                Unprocessed
              </Badge>
            )}
            {isOver && (
              <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] shrink-0">
                Older than 24h
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {issue.locality || issue.address || '-'}
            </span>
            <span className="capitalize">{issue.category?.replace(/_/g, ' ')}</span>
            <span>{createdAgo}</span>
            <span className="truncate max-w-[120px]">Reporter: {issue.reporterName || 'Citizen'}</span>
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
          {/* Detailed case info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {/* Show image on mobile in expanded view */}
              <div className="sm:hidden mb-3">
                {issue.imageURLs?.[0] ? (
                  <img src={issue.imageURLs[0]} alt={safeText(issue.title, 'Issue photo')} className="w-full h-40 object-cover rounded-lg border shadow-sm" />
                ) : (
                  <div className="w-full h-40 bg-muted rounded-lg border flex items-center justify-center text-muted-foreground text-xs shadow-sm">No Image</div>
                )}
              </div>
              
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">Case Details</p>
                <p className="text-sm leading-relaxed mb-2">{safeText(issue.description, 'No description provided.')}</p>
                {issue.formalComplaint && (
                  <div className="mt-2 p-2 bg-background border rounded-lg">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Formal Draft Available</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">"{issue.formalComplaint}"</p>
                  </div>
                )}
              </div>

              <div className="bg-background p-2.5 rounded-lg border text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{issue.address || issue.locality || 'Location recorded'}</span>
                </div>
                {issue.latitude && issue.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 pl-5"
                  >
                    View on Google Maps (Lat: {issue.latitude.toFixed(5)}, Lng: {issue.longitude.toFixed(5)})
                  </a>
                )}
              </div>

              {issue.publicRisk && (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded border border-amber-100 text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs">{issue.publicRisk}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">AI Analysis & Community</p>
                {issue.suggestedNextAction && (
                  <div className="flex items-start gap-2 text-xs mb-2 bg-background p-2 rounded border">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700"><span className="font-semibold block mb-0.5">Suggested Action:</span>{issue.suggestedNextAction}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1 text-xs text-slate-600 bg-background p-2 rounded border">
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Verification: <span className="font-semibold uppercase">{formatVerificationStatus(issue.verificationStatus)}</span></span>
                  </div>
                  <span className="ml-5 text-[10px]">Confirms: {issue.confirmations ?? 0} | Fake Reports: {issue.fakeReports ?? 0} | Score: {issue.communityScore ?? 0}</span>
                </div>
              </div>

              {issue.timeline && issue.timeline.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Recent Timeline</p>
                  <div className="text-xs space-y-1.5 max-h-24 overflow-y-auto">
                    {issue.timeline.slice(-3).reverse().map((entry, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0 w-12 border-r">
                          {formatTimelineDate(entry.timestamp)}
                        </span>
                        <span className="text-slate-700 line-clamp-1">{safeText(entry.note, 'Case updated')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Department & Status update */}
          <div className="border-t pt-4 bg-background p-4 rounded-xl shadow-sm">
            <p className="text-xs font-semibold mb-4 uppercase tracking-wide text-indigo-700">
              Department Action Workflow
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Department Select */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Current / Assigned Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select 
                    className="w-full pl-9 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">-- Select Department --</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {!department && issue.assignedDepartment && (
                  <p className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1">
                    <Star className="h-3 w-3" /> AI Suggested: {issue.assignedDepartment}
                  </p>
                )}
              </div>

              {/* Action Note */}
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-1">Action Taken / Department Note</label>
                <textarea
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                  placeholder="e.g. Inspection team dispatched."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* Status Buttons */}
            <div className="mb-4">
              <label className="block text-[10px] font-semibold text-muted-foreground uppercase mb-2">Official Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map(s => {
                  const isDisabled = isStatusDisabled(s);
                  return (
                    <button
                      key={s}
                      disabled={isDisabled}
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                          : newStatus === s
                          ? (STATUS_COLORS[s] ?? 'bg-primary/10 border-primary text-primary') + ' ring-2 ring-primary/30 shadow-sm'
                          : 'border-border text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t">
              <Button
                size="sm"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Saving...' : 'Publish Update'}
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => { 
                  setNewStatus(issue.status); 
                  setDepartment(issue.assignedDepartment || ''); 
                  setNote(''); 
                }}
              >
                <RotateCcw className="h-3 w-3" /> Reset Changes
              </button>
              {savedMsg && (
                <span className={cn('text-xs font-medium ml-auto', savedMsg === 'Updated' ? 'text-emerald-600' : 'text-destructive')}>
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

// Authority Dashboard Page

export default function AuthorityDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  // Map & View Mode states
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterAi, setFilterAi] = useState<string>('all');
  const [filterVerif, setFilterVerif] = useState<string>('all');

  useEffect(() => {
    const unsub = subscribeToAllIssues((fetched) => {
      setIssues(fetched);
      setLoading(false);
    }, 500); // larger limit for admin
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

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => {
        const searchableText = [
          i.title,
          i.description,
          i.address,
          i.locality,
          i.reporterName,
          i.assignedDepartment,
        ].map(value => safeText(value).toLowerCase()).join(' ');
        return searchableText.includes(q);
      });
    }

    // Filters
    if (filterStatus !== 'all') result = result.filter(i => i.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter(i => i.category === filterCategory);
    if (filterSeverity !== 'all') result = result.filter(i => i.aiSeverity === filterSeverity);
    if (filterDept !== 'all') {
      if (filterDept === 'unassigned') result = result.filter(i => !i.assignedDepartment);
      else result = result.filter(i => i.assignedDepartment === filterDept);
    }
    if (filterAi !== 'all') {
      const isProcessed = filterAi === 'processed';
      result = result.filter(i => !!i.aiProcessed === isProcessed);
    }
    if (filterVerif !== 'all') {
      result = result.filter(i => i.verificationStatus === filterVerif);
    }

    // Sort
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
  }, [issues, searchQuery, filterStatus, filterCategory, filterSeverity, filterDept, filterAi, filterVerif, sortKey, sortDir]);

  // Initialize/destroy map when viewMode changes
  useEffect(() => {
    if (viewMode !== 'map') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
      return;
    }

    // Wait a brief tick for the container DOM node to render and occupy space
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (typeof L === 'undefined') {
        setMapError('Leaflet failed to load. Please check your connection.');
        return;
      }

      const defaultCenter = [20.5937, 78.9629];
      const defaultZoom = 5;

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: defaultZoom,
        zoomControl: false,
      });

      if (map.attributionControl) {
        map.attributionControl.setPrefix('<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>');
      }

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const markersGroup = L.markerClusterGroup().addTo(map);

      mapRef.current = map;
      markersGroupRef.current = markersGroup;
      setMapError(null);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, [viewMode]);

  // Update map markers when filtered list changes
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup || viewMode !== 'map') return;

    markersGroup.clearLayers();
    const markersList: any[] = [];

    const mappable = filtered.filter(
      (i) => i.latitude !== 0 && i.longitude !== 0 && i.latitude != null && i.longitude != null
    );

    mappable.forEach((issue) => {
      const lat = issue.latitude;
      const lng = issue.longitude;
      if (!lat || !lng) return;

      const catInfo = categories.find((c) => c.value === issue.category) || categories[categories.length - 1];

      const customIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg ${catInfo.color} text-white"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span></div>`,
        className: 'custom-marker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 text-xs w-48 animate-fade-in';
      popupContent.innerHTML = `
        <div class="font-bold text-sm leading-tight mb-1 truncate">${issue.title || 'Untitled Issue'}</div>
        <div class="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">${issue.category.replace(/_/g, ' ')}</div>
        ${issue.imageURLs?.[0] ? `<img src="${issue.imageURLs[0]}" class="w-full h-20 object-cover rounded-md mb-2" />` : ''}
        <div class="line-clamp-2 text-[11px] mb-2 text-slate-600">${issue.description || 'No description provided.'}</div>
        <div class="flex items-center justify-between border-t pt-2 mt-1">
          <span class="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded capitalize">${issue.status.replace(/_/g, ' ')}</span>
          <span class="text-[10px] font-bold text-indigo-600 capitalize">Severity: ${issue.aiSeverity || 'medium'}</span>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
      markersGroup.addLayer(marker);
      markersList.push(marker);
    });

    if (markersList.length > 0) {
      try {
        const bounds = markersGroup.getBounds();
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      } catch (err) {
        console.warn('Could not auto-zoom map bounds:', err);
      }
    }
  }, [filtered, viewMode]);

  // Summary stats
  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
  const assigned = issues.filter(i => i.status === 'assigned').length;
  const inProgress = issues.filter(i => i.status === 'in_progress').length;
  const newCases = issues.filter(i => i.status === 'submitted' || i.status === 'under_review').length;
  const attentionNeeded = issues.filter(needsAttention).length;

  const summaryStats = [
    { label: 'Total Cases', value: total, icon: Filter, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { label: 'New / Under Review', value: newCases, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Needs Attention', value: attentionNeeded, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-500/10', glow: attentionNeeded > 0 },
    { label: 'Assigned', value: assigned, icon: Building2, color: 'text-cyan-600', bg: 'bg-cyan-500/10' },
    { label: 'In Progress', value: inProgress, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { label: 'Resolved / Closed', value: resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  ];

  function SortButton({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors',
          active
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'border-border text-muted-foreground hover:bg-muted'
        )}
      >
        <ArrowUpDown className="h-3 w-3" />
        {label}
        {active && <span className="text-[10px]">{sortDir === 'desc' ? 'desc' : 'asc'}</span>}
      </button>
    );
  }

  return (
    <div className="py-4 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center shrink-0">
              <img src="/logo.png" alt="CivicPulse AI" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-slate-800">Civic Operations Console</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Review, prioritize, and manage departmental assignments for civic cases.
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryStats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn("border-0 shadow-sm", s.glow ? "ring-2 ring-red-400 ring-offset-1" : "")}>
              <CardContent className="p-3 md:p-4">
                <div className={cn('mb-2 inline-flex rounded-lg p-2', s.bg)}>
                  <Icon className={cn('h-4 w-4', s.color)} />
                </div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide leading-tight">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all',
            viewMode === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Filter className="h-4 w-4" />
          List Queue
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all',
            viewMode === 'map'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <MapPin className="h-4 w-4" />
          Map Explorer View
        </button>
      </div>

      {/* Filter + Search bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          
          {/* Top Row: Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by title, location, reporter, or department..."
              className="w-full pl-9 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Filters</span>

            {/* Department */}
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Departments</option>
              <option value="unassigned">Unassigned</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 hidden sm:block"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
              ))}
            </select>

            {/* Severity */}
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 hidden sm:block"
            >
              <option value="all">All Severities</option>
              {['critical', 'high', 'medium', 'low'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* AI Processed */}
            <select
              value={filterAi}
              onChange={e => setFilterAi(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 hidden lg:block"
            >
              <option value="all">AI Analysis (All)</option>
              <option value="processed">Processed</option>
              <option value="unprocessed">Unprocessed</option>
            </select>
            
            {/* Verification */}
            <select
              value={filterVerif}
              onChange={e => setFilterVerif(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 hidden xl:block"
            >
              <option value="all">Community Verif. (All)</option>
              <option value="unverified">Unverified</option>
              <option value="community_verified">Verified</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap border-t pt-3 mt-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Sort:</span>
            <SortButton label="Date" k="createdAt" />
            <SortButton label="Urgency" k="urgencyScore" />
            <span className="text-xs font-medium text-slate-500 ml-auto">
              Showing {filtered.length} of {total} cases
            </span>
          </div>
        </CardContent>
      </Card>

      {/* View Content */}
      {viewMode === 'map' ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="overflow-hidden border shadow-sm relative w-full h-[550px]">
            <CardContent className="p-0 h-full w-full relative">
              {mapError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-destructive/5 gap-3">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                  <p className="font-semibold text-sm text-destructive">{mapError}</p>
                </div>
              )}
              <div
                ref={mapContainerRef}
                className="w-full h-full z-10"
                style={{ minHeight: '550px' }}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="shrink-0 border shadow-sm">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category Colors
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge key={cat.value} variant="outline" className="gap-1.5 text-xs py-1">
                    <span className={`h-2.5 w-2.5 rounded-full ${cat.color}`} />
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Issues list */
        loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <span className="text-sm font-medium">Loading case queue...</span>
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-medium text-slate-500">No cases match the current filters.</p>
              <button
                className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
                onClick={() => { 
                  setSearchQuery('');
                  setFilterStatus('all'); setFilterCategory('all'); setFilterSeverity('all'); 
                  setFilterDept('all'); setFilterAi('all'); setFilterVerif('all');
                }}
              >
                Clear all filters
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(issue => (
              <IssueRow key={issue.id} issue={issue} onUpdated={() => {}} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

