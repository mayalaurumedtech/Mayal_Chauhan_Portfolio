import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, RotateCw, Square, Circle, RectangleHorizontal, Maximize } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface ImageCropperProps {
  image: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
}

interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AspectOption = 'square' | 'circle' | 'landscape' | 'portrait' | 'full';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: CroppedAreaPixels,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to center before rotating
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract the cropped area
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('No 2d context');
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};

export const ImageCropper = ({
  image,
  open,
  onClose,
  onCropComplete,
  aspectRatio = 1,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [processing, setProcessing] = useState(false);
  const [aspectOption, setAspectOption] = useState<AspectOption>('circle');

  const aspectRatios: Record<AspectOption, { ratio: number | undefined; shape: 'round' | 'rect' }> = {
    square: { ratio: 1, shape: 'rect' },
    circle: { ratio: 1, shape: 'round' },
    landscape: { ratio: 16 / 9, shape: 'rect' },
    portrait: { ratio: 3 / 4, shape: 'rect' },
    full: { ratio: undefined, shape: 'rect' },
  };

  const currentAspect = aspectRatios[aspectOption];

  const onCropCompleteCallback = useCallback(
    (_: any, croppedAreaPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleUseOriginal = async () => {
    setProcessing(true);
    try {
      // In Profile.tsx, image is already an object URL
      // We can fetch it and get the blob to maintain consistency
      const response = await fetch(image);
      const blob = await response.blob();
      onCropComplete(blob);
      onClose();
    } catch (error) {
      console.error('Error using original image:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
        </DialogHeader>

        <div className="relative h-[300px] w-full bg-muted rounded-lg overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect.ratio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
            cropShape={currentAspect.shape}
            showGrid={currentAspect.shape === 'rect'}
          />
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Crop Shape</Label>
            <ToggleGroup
              type="single"
              value={aspectOption}
              onValueChange={(value) => value && setAspectOption(value as AspectOption)}
              className="justify-start"
            >
              <ToggleGroupItem value="circle" aria-label="Circle crop" className="gap-2">
                <Circle className="h-4 w-4" />
                Circle
              </ToggleGroupItem>
              <ToggleGroupItem value="square" aria-label="Square crop" className="gap-2">
                <Square className="h-4 w-4" />
                Square
              </ToggleGroupItem>
              <ToggleGroupItem value="full" aria-label="Full image" className="gap-2">
                <Maximize className="h-4 w-4" />
                Full
              </ToggleGroupItem>
              {/* <ToggleGroupItem value="landscape" aria-label="Landscape crop" className="gap-2">
                <RectangleHorizontal className="h-4 w-4" />
                16:9
              </ToggleGroupItem>
              <ToggleGroupItem value="portrait" aria-label="Portrait crop" className="gap-2">
                <RectangleHorizontal className="h-4 w-4 rotate-90" />
                3:4
              </ToggleGroupItem> */}
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                Zoom
                <ZoomIn className="h-4 w-4" />
              </Label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotate}
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate 90°
            </Button>
            <span className="text-sm text-muted-foreground ml-auto">
              {rotation}° rotation
            </span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 mr-auto w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={handleUseOriginal} disabled={processing} className="flex-1 sm:flex-none">
              Use Original
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={processing}
              className="gradient-primary flex-1 sm:flex-none"
            >
              {processing ? 'Processing...' : 'Apply Crop'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
