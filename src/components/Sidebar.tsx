import { useTranslation } from 'react-i18next';
import { 
  Library, 
  Tag, 
  Clock, 
  Star, 
  Settings, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bug
} from 'lucide-react';
import { cn } from "../lib/utils";
import { useSettingsStore } from "../store/settingsStore";
import { Button } from './ui/button';
import { useState } from 'react';

export function Sidebar() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage, language } = useSettingsStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isRTL = language === 'fa';

  const menuItems = [
    { id: 'library', icon: Library, label: t('navigation.library') },
    { id: 'tags', icon: Tag, label: t('navigation.tags') },
    { id: 'recent', icon: Clock, label: t('navigation.recent') },
    { id: 'favorites', icon: Star, label: t('navigation.favorites') },
    { id: 'statistics', icon: BarChart3, label: t('navigation.statistics') },
    { id: 'logs', icon: Bug, label: t('navigation.logs') },
    { id: 'settings', icon: Settings, label: t('navigation.settings') },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isRTL && "border-l border-r-0"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{t('app.name')}</span>
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("h-8 w-8", isCollapsed && "mx-auto")}
        >
          {isCollapsed ? (
            isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3",
                isCollapsed && "justify-center px-2",
                isActive && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => setCurrentPage(item.id as any)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <div className="rounded-lg bg-muted p-3 text-xs">
            <p className="font-medium">{t('app.tagline')}</p>
            <p className="mt-1 text-muted-foreground">
              {t('common.loading')}
            </p>
          </div>
        ) : (
          <div className="mx-auto h-2 w-2 rounded-full bg-primary"></div>
        )}
      </div>
    </aside>
  );
}
