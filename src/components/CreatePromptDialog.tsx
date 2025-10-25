import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { X } from 'lucide-react';
import { usePromptStore } from '../store/promptStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/use-toast';

interface PromptFormData {
  title: string;
  description: string;
  content: string;
  type: 'text' | 'code' | 'image' | 'video' | 'audio';
  tags: string[];
}

export function CreatePromptDialog() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isCreating, setIsCreating, selectedPrompt } = usePromptStore();
  const [formData, setFormData] = useState<PromptFormData>({
    title: '',
    description: '',
    content: '',
    type: 'text',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://127.0.0.1:3456/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create prompt');

      const result = await response.json();
      
      toast({
        title: t('notifications.promptCreated'),
        description: t('notifications.promptCreatedDesc'),
      });

      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        content: '',
        type: 'text',
        tags: [],
      });
      
      // Refresh prompts list
      window.location.reload();
    } catch (error) {
      toast({
        title: t('errors.createFailed'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <Dialog open={isCreating} onOpenChange={setIsCreating}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('prompt.createPrompt')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t('prompt.title')}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t('prompt.titlePlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="description">{t('prompt.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('prompt.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">{t('prompt.type')}</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
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

          <div>
            <Label htmlFor="content">{t('prompt.content')}</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder={t('prompt.contentPlaceholder')}
              rows={10}
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="tags">{t('tag.tags')}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
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
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
