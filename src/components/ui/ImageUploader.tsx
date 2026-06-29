import { useState, useRef } from 'react';
import { Camera, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface ImageUploaderProps {
  onChange: (url: string) => void;
  onUploadStart?: () => void;
  defaultImage?: string;
}

export function ImageUploader({ onChange, onUploadStart, defaultImage }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (onUploadStart) {
      onUploadStart();
    }
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      setIsUploading(true);
      const url = await uploadImageToCloudinary(file);
      onChange(url);
    } catch (error) {
      console.error('Failed to upload image', error);
      // Revert preview on failure
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      
      <div 
        className="relative flex h-64 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/20 transition-all hover:bg-muted/40"
        onClick={triggerFileInput}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <p className="text-white font-medium flex items-center gap-2">
                <Camera className="w-5 h-5" /> Retake Photo
              </p>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm font-medium animate-pulse">Uploading...</p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <UploadCloud className="h-8 w-8" />
            </div>
            <p className="font-semibold text-foreground mb-1">Tap to capture or upload</p>
            <p className="text-sm">Please take a clear picture of the issue</p>
          </div>
        )}
      </div>

      {!preview && (
        <Button onClick={triggerFileInput} className="w-full shadow-sm" size="lg">
          <Camera className="mr-2 h-5 w-5" />
          Take Photo
        </Button>
      )}
    </div>
  );
}
