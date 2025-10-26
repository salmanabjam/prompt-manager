import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { logger, LogCategory } from '../lib/logger';

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTagDialog({ isOpen, onClose, onSuccess }: CreateTagDialogProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    logger.apiRequest('POST', '/api/tags', formData);

    try {
      const response = await fetch('http://127.0.0.1:3456/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.apiError('POST', '/api/tags', new Error(`HTTP ${response.status}`));
        
        // Handle duplicate tag name
        if (response.status === 409) {
          toast.error(t('errors.tagAlreadyExists'));
          setIsSubmitting(false);
          return;
        }
        
        throw new Error('Failed to create tag');
      }

      const result = await response.json();
      logger.apiSuccess('POST', '/api/tags', result);

      toast.success(t('notifications.tagCreated'));
      setFormData({ name: '', color: '#6366f1' });
      onSuccess();
      onClose();
    } catch (error) {
      logger.error(LogCategory.API, 'Failed to create tag', error as Error, {
        component: 'CreateTagDialog',
        action: 'createTag',
        context: 'Creating new tag',
      });

      console.error('Error creating tag:', error);
      toast.error(t('notifications.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('tag.createTag')}</DialogTitle>
          <DialogDescription>
            {t('tag.createTagDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('tag.title')}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('tag.placeholder.name')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">{t('tag.color')}</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="#6366f1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
