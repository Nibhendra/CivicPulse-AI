import { MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const categories = [
  { label: 'Pothole', color: 'bg-red-500' },
  { label: 'Drain', color: 'bg-amber-500' },
  { label: 'Garbage', color: 'bg-green-500' },
  { label: 'Water Leak', color: 'bg-blue-500' },
  { label: 'Streetlight', color: 'bg-yellow-500' },
  { label: 'Broken Road', color: 'bg-orange-500' },
];

export default function MapPage() {
  return (
    <div className="flex flex-col animate-fade-in space-y-4">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
          <MapPin className="h-6 w-6 text-emerald-500 md:h-7 md:w-7" />
          Issue Map Explorer
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Interactive map with issue clustering — coming in the next phase.
        </p>
      </div>

      {/* Faux map area — taller on desktop to use available viewport */}
      <Card className="overflow-hidden w-full">
        <CardContent className="relative p-0">
          <div
            className="flex h-64 items-center justify-center sm:h-80 md:h-[calc(100vh-16rem)]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.08) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundColor: 'hsl(var(--muted) / 0.3)',
            }}
          >
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="rounded-2xl bg-emerald-500/10 p-5">
                <MapPin className="h-12 w-12 text-emerald-500 animate-bounce" />
              </div>
              <span className="text-base font-semibold">Leaflet + OpenStreetMap</span>
              <span className="text-sm text-muted-foreground/70">Interactive map coming soon</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold md:text-base">Category Legend</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat.label} variant="outline" className="gap-1.5">
                <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                {cat.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
