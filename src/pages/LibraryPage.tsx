import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, FileText, Code, Image, Video, Music, Copy, Edit, Star, Check, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { EditPromptDialog } from '../components/EditPromptDialog';
import { PromptDetailModal } from '../components/PromptDetailModal';
import { useToast } from '../hooks/use-toast';
import { logger, LogCategory } from '../lib/logger';
import { useFavoritesStore } from '../store/favoritesStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

interface PromptImage {
  id: string;
  filename: string;
  storedName: string;
  path: string;
  thumbnail: string;
  mimeType: string;
}

interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: string;
  language: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { name: string; color?: string } }>;
  images?: PromptImage[];
}

async function fetchPrompts(): Promise<Prompt[]> {
  const response = await fetch('http://127.0.0.1:3456/api/prompts');
  if (!response.ok) throw new Error('Failed to fetch prompts');
  const data = await response.json();
  const prompts = data.data || [];
  
  // Fetch images for each prompt
  const promptsWithImages = await Promise.all(
    prompts.map(async (prompt: Prompt) => {
      try {
        const imagesResponse = await fetch(`http://127.0.0.1:3456/api/prompts/${prompt.id}/images`);
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          console.log(`Images for prompt ${prompt.id}:`, imagesData.data);
          return { ...prompt, images: imagesData.data || [] };
        }
      } catch (error) {
        console.error(`Failed to fetch images for prompt ${prompt.id}:`, error);
      }
      return { ...prompt, images: [] };
    })
  );
  
  console.log('Prompts with images:', promptsWithImages);
  return promptsWithImages;
}

export function LibraryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // استفاده از Zustand store برای مدیریت favorites
  const favorites = useFavoritesStore((state) => state.favorites);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const isFavorite = useFavoritesStore((state) => state.isFavorite);
  
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{ src: string; x: number; y: number } | null>(null);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  
  const { data: prompts, isLoading, error, refetch } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  });

  // Track Ctrl key state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setIsCtrlPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
        setHoveredImage(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleCopy = async (promptId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: t('notifications.copiedToClipboard'),
        description: t('prompt.title') + ' copied successfully',
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: t('notifications.error'),
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleFavorite = (promptId: string) => {
    const wasFavorite = isFavorite(promptId);
    toggleFavorite(promptId);
    
    if (wasFavorite) {
      console.log('[LibraryPage] Removed from favorites:', promptId);
      toast({
        title: 'Removed from favorites',
      });
    } else {
      console.log('[LibraryPage] Added to favorites:', promptId);
      toast({
        title: 'Added to favorites',
      });
    }
  };

  const handleDelete = async (promptId: string) => {
    logger.apiRequest('DELETE', `/api/prompts/${promptId}`);
    
    try {
      const response = await fetch(`http://127.0.0.1:3456/api/prompts/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        logger.apiError('DELETE', `/api/prompts/${promptId}`, new Error(`HTTP ${response.status}`));
        throw new Error('Failed to delete prompt');
      }

      logger.apiSuccess('DELETE', `/api/prompts/${promptId}`);
      toast({
        title: t('notifications.promptDeleted'),
        description: 'Prompt has been deleted successfully',
      });
      
      refetch();
      setDeletingPromptId(null);
    } catch (err) {
      logger.error(LogCategory.API, 'Failed to delete prompt', err as Error, {
        component: 'LibraryPage',
        action: 'deletePrompt',
        context: `Deleting prompt ${promptId}`,
      });
      
      console.error('Failed to delete:', err);
      toast({
        title: t('notifications.error'),
        description: 'Failed to delete prompt',
        variant: 'destructive',
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CODE': return Code;
      case 'IMAGE': return Image;
      case 'VIDEO': return Video;
      case 'AUDIO': return Music;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT': return 'text-indigo-500';
      case 'CODE': return 'text-purple-500';
      case 'IMAGE': return 'text-pink-500';
      case 'VIDEO': return 'text-amber-500';
      case 'AUDIO': return 'text-emerald-500';
      default: return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t('notifications.error')}</CardTitle>
            <CardDescription>
              Failed to load prompts. Make sure the API server is running on port 3456.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.location.reload()}>
              {t('common.retry') || 'Retry'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('navigation.library')}</h1>
        <p className="text-muted-foreground">
          {prompts?.length || 0} {t('common.results') || 'prompts'}
        </p>
      </div>

      {/* Prompt Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prompts?.map((prompt) => {
          const TypeIcon = getTypeIcon(prompt.type);
          
          return (
            <Card
              key={prompt.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => setViewingPrompt(prompt)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={cn("rounded-lg p-2 bg-muted", getTypeColor(prompt.type))}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(prompt.id);
                      }}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          favorites.has(prompt.id) && "fill-yellow-400 text-yellow-400"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(prompt.id, prompt.title);
                      }}
                    >
                      {copiedId === prompt.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPrompt(prompt);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingPromptId(prompt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Thumbnail Gallery */}
                {prompt.images && prompt.images.length > 0 && (
                  <div className="mt-3 flex gap-1 overflow-x-auto">
                    {prompt.images.slice(0, 4).map((img) => (
                      <div
                        key={img.id}
                        className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors"
                        onMouseEnter={(e) => {
                          if (isCtrlPressed) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredImage({
                              src: `http://127.0.0.1:3456/${img.path}`,
                              x: rect.right + 10,
                              y: rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          if (hoveredImage) setHoveredImage(null);
                        }}
                      >
                        <img
                          src={`http://127.0.0.1:3456/${img.thumbnail}`}
                          alt={img.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {prompt.images.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{prompt.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
                
                <CardTitle className="line-clamp-1">{prompt.title}</CardTitle>
                {prompt.description && (
                  <CardDescription className="line-clamp-2">
                    {prompt.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {prompt.tags.map((pt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${pt.tag.color}20`,
                        color: pt.tag.color,
                      }}
                    >
                      {pt.tag.name}
                    </span>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    {t('prompt.type')}: {t(`prompt.types.${prompt.type}`)}
                  </span>
                  <span>•</span>
                  <span>
                    {prompt.usageCount} {t('prompt.usageCount')}
                  </span>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {prompts?.length === 0 && (
        <Card className="py-12">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">{t('common.noResults')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('prompt.createNew')}
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('prompt.createNew')}
            </Button>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <EditPromptDialog
        isOpen={!!editingPrompt}
        onClose={() => setEditingPrompt(null)}
        prompt={editingPrompt}
        onSuccess={() => {
          refetch();
          toast({
            title: t('notifications.promptUpdated'),
            description: 'Prompt has been updated successfully',
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPromptId} onOpenChange={() => setDeletingPromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deletePrompt.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deletePrompt.message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPromptId && handleDelete(deletingPromptId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Preview Modal - Shown when Ctrl+Hover */}
      {hoveredImage && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${hoveredImage.x}px`,
            top: `${hoveredImage.y}px`,
          }}
        >
          <div className="bg-background border-2 border-primary rounded-lg shadow-2xl p-2 max-w-md max-h-96 overflow-hidden">
            <img
              src={hoveredImage.src}
              alt="Preview"
              className="w-auto h-auto max-w-full max-h-full object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* Prompt Detail Modal */}
      <PromptDetailModal
        prompt={viewingPrompt}
        open={!!viewingPrompt}
        onOpenChange={(open) => !open && setViewingPrompt(null)}
        onCopy={(content) => handleCopy('detail-modal', content)}
        onFavorite={(id) => handleFavorite(id)}
        isFavorite={viewingPrompt ? isFavorite(viewingPrompt.id) : false}
      />
    </div>
  );
}
