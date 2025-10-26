/**
 * PromptDetailModal - مودال نمایش کامل جزئیات پرامپت
 * با کلیک روی کارت پرامپت، تمام اطلاعات شامل محتوای کامل، تصاویر، تگ‌ها و metadata نمایش داده می‌شود
 */

import { useTranslation } from 'react-i18next';
import { X, Copy, Star, FileText, Code, Image as ImageIcon, Video, Music, Calendar, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';
import { useState } from 'react';

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

interface PromptDetailModalProps {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy?: (content: string) => void;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export function PromptDetailModal({
  prompt,
  open,
  onOpenChange,
  onCopy,
  onFavorite,
  isFavorite = false,
}: PromptDetailModalProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!prompt) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CODE': return Code;
      case 'IMAGE': return ImageIcon;
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
      case 'VIDEO': return 'text-blue-500';
      case 'AUDIO': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const TypeIcon = getTypeIcon(prompt.type);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <TypeIcon className={cn('h-6 w-6', getTypeColor(prompt.type))} />
                <DialogTitle className="text-2xl">{prompt.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                {onCopy && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCopy(prompt.content)}
                    title="Copy content"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {onFavorite && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onFavorite(prompt.id)}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Description */}
              {prompt.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {t('prompt.description')}
                  </h3>
                  <p className="text-base">{prompt.description}</p>
                </div>
              )}

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {t('tags.title')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tagRel) => (
                      <Badge
                        key={tagRel.tag.name}
                        variant="secondary"
                        className="px-3 py-1"
                        style={{
                          backgroundColor: tagRel.tag.color || '#6366f1',
                          color: 'white',
                        }}
                      >
                        {tagRel.tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  {t('prompt.content')}
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {prompt.content}
                  </pre>
                </div>
              </div>

              {/* Images */}
              {prompt.images && prompt.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                    {t('images.title')} ({prompt.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {prompt.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary transition-colors"
                        onClick={() => setSelectedImage(`http://127.0.0.1:3456/${image.path}`)}
                      >
                        <img
                          src={`http://127.0.0.1:3456/${image.thumbnail}`}
                          alt={image.filename}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{image.filename}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('prompt.created')}
                  </h3>
                  <p className="text-sm">
                    {formatRelativeTime(new Date(prompt.createdAt))}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t('prompt.updated')}
                  </h3>
                  <p className="text-sm">
                    {formatRelativeTime(new Date(prompt.updatedAt))}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                    {t('prompt.type')}
                  </h3>
                  <p className="text-sm">{prompt.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                    {t('prompt.language')}
                  </h3>
                  <p className="text-sm">{prompt.language}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1 text-muted-foreground">
                    {t('prompt.usageCount')}
                  </h3>
                  <p className="text-sm">{prompt.usageCount} times</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Full Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-6xl">
            <DialogHeader>
              <DialogTitle>Full Image</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
