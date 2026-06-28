import { useState } from 'react';
import { Camera, MapPin, FileText, CheckCircle, ChevronRight, ChevronLeft, Send, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from './ImageUploader';
import type { LocationData } from './LocationPicker';
import { LocationPicker } from './LocationPicker';
import { createIssue } from '@/lib/issues';
import type { IssueCategory } from '@/types/issue';
import { useNavigate } from 'react-router-dom';

const steps = [
  { id: 1, icon: Camera, label: 'Photo' },
  { id: 2, icon: FileText, label: 'Details' },
  { id: 3, icon: MapPin, label: 'Location' },
  { id: 4, icon: CheckCircle, label: 'Review' },
];

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'pothole', label: 'Road / Pothole' },
  { value: 'broken_road', label: 'Broken Road' },
  { value: 'drain', label: 'Water & Drainage' },
  { value: 'water_leak', label: 'Water Leakage' },
  { value: 'garbage', label: 'Garbage / Waste' },
  { value: 'streetlight', label: 'Street Lighting' },
  { value: 'public_infra', label: 'Public Infrastructure' },
  { value: 'other', label: 'Other' },
];

export function IssueForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form state
  const [imageUrl, setImageUrl] = useState('');
  const [details, setDetails] = useState({
    category: 'pothole' as IssueCategory,
    title: '',
    description: '',
  });
  const [location, setLocation] = useState<LocationData>({
    latitude: null,
    longitude: null,
    address: '',
    locality: '',
  });

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const issueId = await createIssue({
        // Only include imageUrl if it's a valid non-empty Cloudinary URL
        imageURLs: imageUrl && imageUrl.trim() ? [imageUrl.trim()] : [],
        title: details.title.trim(),
        description: details.description.trim(),
        category: details.category,
        latitude: location.latitude ?? undefined,
        longitude: location.longitude ?? undefined,
        address: location.address.trim(),
        locality: location.locality.trim(),
      });
      // Navigate to the new issue detail
      navigate(`/issue/${issueId}`, { replace: true });
    } catch (error) {
      console.error('Failed to submit issue:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) return false; // Photo is optional — user can skip
    if (currentStep === 2) return !details.title.trim() || !details.description.trim() || !details.category;
    if (currentStep === 3) {
      const hasImage = !!imageUrl.trim();
      const hasLocation = !!location.address.trim() || location.latitude !== null;
      if (!hasImage) return !hasLocation; // If no photo, must provide address or GPS
      return false;
    }
    return false;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
      {/* Progress Indicator */}
      <div className="relative mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-110'
                      : isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <step.icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] font-medium absolute -bottom-6 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[350px]">
        {/* ── Step 1: Photo ── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Add a Photo</h2>
              <p className="text-sm text-muted-foreground">A clear picture helps authorities identify the issue.</p>
            </div>
            <ImageUploader onChange={setImageUrl} defaultImage={imageUrl} />
            {!imageUrl && (
              <p className="text-center text-xs text-muted-foreground mt-2">
                Photo is optional — you can still submit without one.
              </p>
            )}
          </div>
        )}

        {/* ── Step 2: Details ── */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Issue Details</h2>
              <p className="text-sm text-muted-foreground">What kind of problem are you reporting?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={details.category}
                onChange={(e) => setDetails({ ...details, category: e.target.value as IssueCategory })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="E.g., Deep pothole on Main Street"
                value={details.title}
                onChange={(e) => setDetails({ ...details, title: e.target.value })}
                maxLength={120}
              />
              {!details.title.trim() && (
                <p className="text-[11px] text-muted-foreground">A short title helps others find this issue.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                placeholder="Add any additional details that might help..."
                value={details.description}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                maxLength={1000}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Location ── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Location</h2>
              <p className="text-sm text-muted-foreground">Pinpoint where this issue is located.</p>
            </div>
            <LocationPicker onChange={setLocation} defaultData={location} />
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Review & Submit</h2>
              <p className="text-sm text-muted-foreground">Verify the details before reporting.</p>
            </div>

            <Card className="overflow-hidden border shadow-sm">
              <div className="h-40 w-full overflow-hidden bg-muted relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="Issue preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Camera className="h-8 w-8" />
                    <span className="text-sm">No photo attached</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold shadow-sm capitalize">
                  {details.category.replace(/_/g, ' ')}
                </div>
              </div>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg leading-tight">{details.title || '—'}</h3>
                  {details.description && (
                    <p className="text-sm text-muted-foreground mt-1">{details.description}</p>
                  )}
                </div>

                <div className="flex items-start gap-2 pt-3 border-t">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    {location.address ? (
                      <>
                        <p className="font-medium">{location.address}</p>
                        {location.locality && <p className="text-muted-foreground">{location.locality}</p>}
                      </>
                    ) : location.latitude ? (
                      <p className="text-muted-foreground">
                        GPS: {location.latitude.toFixed(5)}, {location.longitude?.toFixed(5)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground italic">No location provided</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit error */}
            {submitError && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{submitError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="ghost"
          onClick={handlePrev}
          disabled={currentStep === 1 || isSubmitting}
          className={currentStep === 1 ? 'invisible' : ''}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext} disabled={isNextDisabled()}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
          >
            {isSubmitting ? (
              <>Submitting... <div className="ml-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
            ) : (
              <>Submit Issue <Send className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
