import { useState } from 'react';
import { MapPin, Navigation, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  locality: string;
}

interface LocationPickerProps {
  onChange: (data: LocationData) => void;
  defaultData?: LocationData;
}

export function LocationPicker({ onChange, defaultData }: LocationPickerProps) {
  const [data, setData] = useState<LocationData>({
    latitude: defaultData?.latitude || null,
    longitude: defaultData?.longitude || null,
    address: defaultData?.address || '',
    locality: defaultData?.locality || '',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateData = (updates: Partial<LocationData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onChange(newData);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to detect location. Please enter manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border bg-card p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="mb-3 rounded-full bg-blue-500/10 p-3 text-blue-600">
            <Navigation className={`h-6 w-6 ${isLocating ? 'animate-spin' : 'animate-bounce'}`} />
          </div>
          <h3 className="font-semibold mb-1">Where is the issue?</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
            GPS accuracy helps authorities locate the problem quickly.
          </p>
          <Button 
            onClick={handleDetectLocation} 
            disabled={isLocating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
          >
            {isLocating ? 'Detecting...' : 'Detect My Location'}
            {!isLocating && <MapPin className="ml-2 h-4 w-4" />}
          </Button>
          
          {data.latitude && data.longitude && (
            <p className="mt-3 text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3" /> Location captured ({data.latitude.toFixed(4)}, {data.longitude.toFixed(4)})
            </p>
          )}
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Manual Address Details</h4>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Street Address / Landmark</Label>
          <Input
            id="address"
            placeholder="E.g., Near City Mall, Main Gate"
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            className="focus-visible:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="locality">Locality / Area</Label>
          <Input
            id="locality"
            placeholder="E.g., Downtown, Sector 4"
            value={data.locality}
            onChange={(e) => updateData({ locality: e.target.value })}
            className="focus-visible:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
