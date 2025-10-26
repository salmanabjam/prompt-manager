import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Star, FileText, Code, Image, Video, Music } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { formatRelativeTime } from '../lib/utils';
import { useFavoritesStore } from '../store/favoritesStore';

interface Prompt {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: string;
  language: string;
  usageCount: number;
  updatedAt: string;
  tags: Array<{ tag: { name: string; color?: string } }>;
}

async function fetchPrompts(): Promise<Prompt[]> {
  const response = await fetch('http://127.0.0.1:3456/api/prompts');
  if (!response.ok) throw new Error('Failed to fetch prompts');
  const data = await response.json();
  return data.data || [];
}

export function FavoritesPage() {
  const { t } = useTranslation();
  
  // استفاده از Zustand store برای مدیریت favorites
  const favorites = useFavoritesStore((state) => state.favorites);
  const getFavoritesArray = useFavoritesStore((state) => state.getFavoritesArray);

  const { data: allPrompts, isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: fetchPrompts,
  });

  // فیلتر کردن prompts بر اساس favorites
  const favoritePrompts = allPrompts?.filter(p => favorites.has(p.id)) || [];
  
  console.log('[FavoritesPage] Favorites IDs:', getFavoritesArray());
  console.log('[FavoritesPage] All prompts count:', allPrompts?.length);
  console.log('[FavoritesPage] Favorite prompts count:', favoritePrompts.length);

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
      case 'VIDEO': return 'text-blue-500';
      case 'AUDIO': return 'text-green-500';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('navigation.favorites')}</h1>
        <p className="text-muted-foreground">
          {favoritePrompts.length} favorite prompts
        </p>
      </div>

      {favoritePrompts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favoritePrompts.map((prompt) => {
            const TypeIcon = getTypeIcon(prompt.type);
            return (
              <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <TypeIcon className={cn('h-5 w-5', getTypeColor(prompt.type))} />
                      <CardTitle className="text-lg line-clamp-1">{prompt.title}</CardTitle>
                    </div>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  {prompt.description && (
                    <CardDescription className="line-clamp-2">
                      {prompt.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {prompt.content}
                  </p>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {prompt.tags.map((tagRel) => (
                        <Badge
                          key={tagRel.tag.name}
                          variant="secondary"
                          style={{
                            backgroundColor: tagRel.tag.color || '#6366f1',
                            color: 'white',
                          }}
                        >
                          {tagRel.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatRelativeTime(new Date(prompt.updatedAt))}</span>
                  <span>{prompt.usageCount} uses</span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Star className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Favorites Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Star prompts to add them to your favorites
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
