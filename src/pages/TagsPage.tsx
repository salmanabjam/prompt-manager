import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Tag, Loader2, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CreateTagDialog } from '../components/CreateTagDialog';
import { useState } from 'react';

interface TagData {
  id: string;
  name: string;
  color?: string;
  _count?: {
    prompts: number;
  };
}

async function fetchTags(): Promise<TagData[]> {
  const response = await fetch('http://127.0.0.1:3456/api/tags');
  if (!response.ok) throw new Error('Failed to fetch tags');
  const data = await response.json();
  return data.data || [];
}

export function TagsPage() {
  const { t } = useTranslation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { data: tags, isLoading, error, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('navigation.tags')}</h1>
          <p className="text-muted-foreground">
            {tags?.length || 0} tags available
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('tag.createTag')}
        </Button>
      </div>

      {tags && tags.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tags.map((tag) => (
            <Card key={tag.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge
                    style={{
                      backgroundColor: tag.color || '#6366f1',
                      color: 'white',
                    }}
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {tag.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {tag._count?.prompts || 0} prompts
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Tags Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create tags to organize your prompts
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('tag.createTag')}
            </Button>
          </div>
        </div>
      )}

      <CreateTagDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
