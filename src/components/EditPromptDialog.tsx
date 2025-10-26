import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { X, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/use-toast';
import { logger, LogCategory } from '../lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { ImageGallery } from './ImageGallery';
import { ImageUploader } from './ImageUploader';

interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: string;
  tags?: Array<{ tag: { name: string } }>;
}

interface EditPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: Prompt | null;
  onSuccess: () => void;
}

export function EditPromptDialog({ isOpen, onClose, prompt, onSuccess }: EditPromptDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);

  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        description: prompt.description || '',
        content: prompt.content || '',
        type: prompt.type.toLowerCase(),
        tags: prompt.tags?.map(t => t.tag.name) || [],
      });
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setIsSubmitting(true);
    logger.apiRequest('PATCH', `/api/prompts/${prompt.id}`, formData);
    
    try {
      const response = await fetch(`http://127.0.0.1:3456/api/prompts/${prompt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        logger.apiError('PATCH', `/api/prompts/${prompt.id}`, new Error(`HTTP ${response.status}`));
        throw new Error('Failed to update prompt');
      }

      logger.apiSuccess('PATCH', `/api/prompts/${prompt.id}`, await response.json());
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      
      toast({
        title: t('notifications.promptUpdated'),
        description: 'Changes saved successfully',
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to update prompt', error as Error, {
        component: 'EditPromptDialog',
        action: 'updatePrompt',
        context: `Updating prompt ${prompt.id}`,
      });
      
      console.error('Error updating prompt:', error);
      toast({
        title: t('notifications.error'),
        description: 'Failed to update prompt',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('prompt.editPrompt')}</DialogTitle>
          <DialogDescription>
            {t('prompt.editPromptDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('prompt.title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('prompt.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('prompt.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('prompt.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('prompt.type')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{t('prompt.types.text')}</SelectItem>
                <SelectItem value="code">{t('prompt.types.code')}</SelectItem>
                <SelectItem value="image">{t('prompt.types.image')}</SelectItem>
                <SelectItem value="video">{t('prompt.types.video')}</SelectItem>
                <SelectItem value="audio">{t('prompt.types.audio')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t('prompt.content')}</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={t('prompt.contentPlaceholder')}
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('tag.tags')}</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder={t('tag.addTag')}
              />
              <Button type="button" onClick={addTag} variant="outline">
                {t('common.add')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('prompt.images')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowImageUploader(!showImageUploader)}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                {showImageUploader ? t('common.hide') : t('prompt.addImages')}
              </Button>
            </div>

            {prompt && <ImageGallery promptId={prompt.id} />}

            {showImageUploader && prompt && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <ImageUploader
                  promptId={prompt.id}
                  onUploadComplete={() => {
                    // Optionally refresh gallery or close uploader
                    setShowImageUploader(false);
                  }}
                  maxFiles={5}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
