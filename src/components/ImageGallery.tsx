import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/use-toast';
import { logger, LogCategory } from '../lib/logger';

interface PromptImage {
  id: string;
  filename: string;
  storedName: string;
  path: string;
  thumbnail: string;
  mimeType: string;
  createdAt?: string;
}

interface ImageGalleryProps {
  promptId: string;
  onImageDeleted?: (imageId: string) => void;
}

export function ImageGallery({ promptId, onImageDeleted }: ImageGalleryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [images, setImages] = useState<PromptImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<PromptImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, [promptId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:3456/api/prompts/${promptId}/images`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.data || []);
      
      logger.info(LogCategory.UI, `Loaded ${data.data?.length || 0} images for prompt ${promptId}`, {
        component: 'ImageGallery',
        promptId,
      });
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to fetch images', error as Error, {
        component: 'ImageGallery',
        promptId,
      });
      
      console.error('Error fetching images:', error);
      toast({
        title: t('notifications.error'),
        description: 'Failed to load images',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (image: PromptImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    setDeleting(true);
    logger.apiRequest('DELETE', `/api/images/${imageToDelete.id}`, null);

    try {
      const response = await fetch(`http://127.0.0.1:3456/api/images/${imageToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        logger.apiError('DELETE', `/api/images/${imageToDelete.id}`, new Error(`HTTP ${response.status}`));
        throw new Error('Failed to delete image');
      }

      logger.apiSuccess('DELETE', `/api/images/${imageToDelete.id}`, { success: true });

      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== imageToDelete.id));

      // Notify parent component
      if (onImageDeleted) {
        onImageDeleted(imageToDelete.id);
      }

      toast({
        title: t('notifications.success'),
        description: 'Image deleted successfully',
      });

      setDeleteDialogOpen(false);
      setImageToDelete(null);
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to delete image', error as Error, {
        component: 'ImageGallery',
        imageId: imageToDelete.id,
      });

      console.error('Error deleting image:', error);
      toast({
        title: t('notifications.error'),
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>{t('prompt.noImages')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group rounded-lg overflow-hidden border bg-card hover:shadow-lg transition-shadow"
            onMouseEnter={() => setHoveredImage(image.id)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            {/* Image */}
            <div className="aspect-square bg-muted">
              <img
                src={`http://127.0.0.1:3456/uploads/thumbnails/${image.storedName}`}
                alt={image.filename}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Overlay with delete button */}
            <div
              className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteClick(image)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                {t('common.delete')}
              </Button>
            </div>

            {/* Filename tooltip */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
              {image.filename}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('prompt.deleteImageTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('prompt.deleteImageConfirm', { filename: imageToDelete?.filename })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
