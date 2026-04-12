// ============================================================================
// DICOM Viewer Component - ASIS 15.0 - Orthanc PACS Integration
// Display DICOM images from Orthanc server with viewer controls
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDicomViewer } from '@/hooks/useDicomViewer';

interface DicomImage {
  id: string;
  instanceId: string;
  seriesNumber: number;
  instanceNumber: number;
  imageUrl: string;
  metadata: {
    patientName: string;
    patientId: string;
    studyDate: string;
    modality: string;
    seriesDescription: string;
  };
}

interface DicomViewerProps {
  imagingOrderId: string;
  seriesId?: string;
  onImageSelected?: (instanceId: string) => void;
}

export const DicomViewer: React.FC<DicomViewerProps> = ({
  imagingOrderId,
  seriesId,
  onImageSelected,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [windowLevel, setWindowLevel] = useState(50);
  const [windowWidth, setWindowWidth] = useState(400);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [images, setImages] = useState<DicomImage[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { fetchDicomImages, downloadImage, loading, error } = useDicomViewer();

  useEffect(() => {
    const loadImages = async () => {
      try {
        const loadedImages = await fetchDicomImages(imagingOrderId, seriesId);
        setImages(loadedImages);
        if (loadedImages.length > 0) {
          onImageSelected?.(loadedImages[0].instanceId);
        }
      } catch (err) {
        console.error('Error loading DICOM images:', err);
      }
    };

    if (imagingOrderId) {
      loadImages();
    }
  }, [imagingOrderId, seriesId, fetchDicomImages, onImageSelected]);

  const currentImage = images[currentImageIndex];

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      onImageSelected?.(images[currentImageIndex - 1].instanceId);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      onImageSelected?.(images[currentImageIndex + 1].instanceId);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 300));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetView = () => {
    setZoom(100);
    setRotation(0);
    setWindowLevel(50);
    setWindowWidth(400);
  };

  const handleDownload = async () => {
    if (currentImage) {
      try {
        await downloadImage(currentImage.instanceId, currentImage.metadata.patientName);
      } catch (err) {
        console.error('Error downloading image:', err);
      }
    }
  };

  const handleFullscreen = () => {
    if (!isFullscreen && viewerRef.current?.requestFullscreen) {
      viewerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (isFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Cargando imágenes DICOM...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            No hay imágenes DICOM disponibles para este estudio
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Viewer Card */}
      <Card ref={viewerRef} className="relative">
        <CardHeader>
          <CardTitle>Visor DICOM (Orthanc PACS)</CardTitle>
          <CardDescription>
            {currentImage?.metadata.modality} -{' '}
            {currentImage?.metadata.seriesDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Image Display */}
          <div className="flex justify-center overflow-auto rounded-lg border border-gray-300 bg-black p-4">
            <div
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease-in-out',
              }}
              className="flex items-center justify-center"
            >
              <img
                src={currentImage?.imageUrl}
                alt={`DICOM Instance ${currentImage?.instanceNumber}`}
                className="max-h-96 max-w-full object-contain"
                style={{
                  filter: `brightness(${100 + windowLevel - 50}%) contrast(${(windowWidth / 400) * 100}%)`,
                }}
              />
            </div>
          </div>

          {/* Image Counter */}
          <div className="text-center text-sm text-gray-600">
            Imagen <strong>{currentImageIndex + 1}</strong> de{' '}
            <strong>{images.length}</strong>
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousImage}
              disabled={currentImageIndex === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Slider
                value={[currentImageIndex]}
                onValueChange={(value) => {
                  const newIndex = value[0];
                  setCurrentImageIndex(newIndex);
                  onImageSelected?.(images[newIndex].instanceId);
                }}
                max={images.length - 1}
                step={1}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleNextImage}
              disabled={currentImageIndex === images.length - 1}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleRotate}
              variant="outline"
              size="sm"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleResetView}
              variant="outline"
              size="sm"
              title="Reset View"
            >
              Restablecer
            </Button>

            <Button
              onClick={handleFullscreen}
              variant="outline"
              size="sm"
              title="Fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              title="Download Image"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Window/Level Adjustment */}
          <div className="space-y-3 rounded-lg bg-gray-50 p-3">
            <div>
              <label className="text-sm font-semibold">
                Window Level: {windowLevel}
              </label>
              <Slider
                value={[windowLevel]}
                onValueChange={(value) => setWindowLevel(value[0])}
                min={0}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">
                Window Width: {windowWidth}
              </label>
              <Slider
                value={[windowWidth]}
                onValueChange={(value) => setWindowWidth(value[0])}
                min={100}
                max={800}
                step={10}
                className="mt-2"
              />
            </div>
          </div>

          {/* Image Metadata */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-semibold mb-2">Información DICOM</div>
            <div className="grid gap-1 text-sm">
              <div>
                <span className="font-semibold">Paciente:</span>{' '}
                {currentImage?.metadata.patientName}
              </div>
              <div>
                <span className="font-semibold">ID Paciente:</span>{' '}
                {currentImage?.metadata.patientId}
              </div>
              <div>
                <span className="font-semibold">Fecha:</span>{' '}
                {new Date(
                  currentImage?.metadata.studyDate || ''
                ).toLocaleDateString('es-ES')}
              </div>
              <div>
                <span className="font-semibold">Modalidad:</span>{' '}
                {currentImage?.metadata.modality}
              </div>
              <div>
                <span className="font-semibold">Item:</span>{' '}
                {currentImage?.instanceNumber}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miniaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setCurrentImageIndex(idx);
                    onImageSelected?.(img.instanceId);
                  }}
                  className={`flex-shrink-0 rounded border-2 overflow-hidden ${
                    idx === currentImageIndex
                      ? 'border-blue-600'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DicomViewer;
