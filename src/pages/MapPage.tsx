import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscribeToAllIssues } from '@/lib/issues';
import type { Issue } from '@/types/issue';

declare const L: any;

const categories = [
  { value: 'pothole', label: 'Pothole', color: 'bg-red-500', hex: '#ef4444' },
  { value: 'drain', label: 'Drainage', color: 'bg-amber-500', hex: '#f59e0b' },
  { value: 'garbage', label: 'Garbage', color: 'bg-green-500', hex: '#22c55e' },
  { value: 'water_leak', label: 'Water Leak', color: 'bg-blue-500', hex: '#3b82f6' },
  { value: 'streetlight', label: 'Streetlight', color: 'bg-yellow-500', hex: '#eab308' },
  { value: 'broken_road', label: 'Broken Road', color: 'bg-orange-500', hex: '#f97316' },
  { value: 'public_infra', label: 'Public Infrastructure', color: 'bg-purple-500', hex: '#a855f7' },
  { value: 'other', label: 'Other', color: 'bg-slate-500', hex: '#64748b' },
];

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // 1. Fetch issues from Firestore
  useEffect(() => {
    const unsubscribe = subscribeToAllIssues((fetched) => {
      // Only map issues that have valid coordinates
      const validIssues = fetched.filter(
        (i) => i.latitude !== 0 && i.longitude !== 0 && i.latitude != null && i.longitude != null
      );
      setIssues(validIssues);
      setLoading(false);
    }, 150);

    return () => unsubscribe();
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof L === 'undefined') {
      setMapError('Leaflet failed to load from CDN. Please check your connection.');
      return;
    }

    // Default center around India if no coordinates
    const defaultCenter = [20.5937, 78.9629];
    const defaultZoom = 5;

    // Create Leaflet Map Instance
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Load OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Create group layer for markers
    const markersGroup = L.markerClusterGroup().addTo(map);

    mapRef.current = map;
    markersGroupRef.current = markersGroup;

    return () => {
      map.remove();
    };
  }, []);

  // 3. Update Markers when Issues load
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || loading) return;

    // Clear previous markers
    markersGroup.clearLayers();

    const markersList: any[] = [];

    issues.forEach((issue) => {
      const lat = issue.latitude;
      const lng = issue.longitude;
      if (!lat || !lng) return;

      const catInfo = categories.find((c) => c.value === issue.category) || categories[categories.length - 1];

      // Custom circular colored pin matching category
      const customIcon = L.divIcon({
        html: `<div class="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-lg ${catInfo.color} text-white"><span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span></div>`,
        className: 'custom-marker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 text-xs w-48';
      popupContent.innerHTML = `
        <div class="font-bold text-sm leading-tight mb-1 truncate">${issue.title || 'Untitled Issue'}</div>
        <div class="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-semibold">${issue.category.replace(/_/g, ' ')}</div>
        ${issue.imageURLs?.[0] ? `<img src="${issue.imageURLs[0]}" class="w-full h-20 object-cover rounded-md mb-2" />` : ''}
        <div class="line-clamp-2 text-[11px] mb-2 text-slate-600">${issue.description || 'No description provided.'}</div>
        <div class="flex items-center justify-between border-t pt-2 mt-1">
          <span class="text-[10px] bg-slate-100 border px-1.5 py-0.5 rounded capitalize">${issue.status.replace(/_/g, ' ')}</span>
          <a href="/issue/${issue.id}" class="text-blue-600 font-bold hover:underline">Details &rarr;</a>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon }).bindPopup(popupContent);
      markersGroup.addLayer(marker);
      markersList.push(marker);
    });

    // Auto-fit bounds if we have markers
    if (markersList.length > 0) {
      try {
        const bounds = markersGroup.getBounds();
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      } catch (err) {
        console.warn('Could not auto-zoom map bounds:', err);
      }
    }
  }, [issues, loading]);

  return (
    <div className="flex flex-col animate-fade-in space-y-4 h-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-emerald-500 md:h-7 md:w-7" />
          Issue Map Explorer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Interactive map pinpointing civic issues and community reports.
        </p>
      </div>

      {/* Map area */}
      <Card className="overflow-hidden w-full border shadow-md relative grow">
        <CardContent className="p-0 h-full min-h-[350px] md:min-h-[450px]">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Loading issue locations…</span>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-destructive/5 gap-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="font-semibold text-sm text-destructive">{mapError}</p>
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-64 sm:h-80 md:h-[calc(100vh-17rem)] z-10"
            style={{ minHeight: '350px' }}
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
  );
}
