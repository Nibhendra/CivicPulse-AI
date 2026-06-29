import { useState, useEffect } from 'react';
import { MapPin, Map, CheckCircle } from 'lucide-react';
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

  // Sync with parent's defaultData when it changes (e.g. geotagged from Step 1)
  useEffect(() => {
    if (defaultData) {
      setData(defaultData);
    }
  }, [defaultData?.latitude, defaultData?.longitude, defaultData?.address, defaultData?.locality]);

  const updateData = (updates: Partial<LocationData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onChange(newData);
  };

  const hasGeotaggedLocation = data.latitude !== null && data.longitude !== null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Show geotagged confirmation if location was captured from Step 1 */}
      {hasGeotaggedLocation && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Location Auto-Captured</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                <MapPin className="w-3 h-3 inline mr-1" />
                {data.locality || data.address || `${data.latitude!.toFixed(4)}, ${data.longitude!.toFixed(4)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">
            {hasGeotaggedLocation ? 'Verify / Edit Address Details' : 'Enter Address Details'}
          </h4>
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
