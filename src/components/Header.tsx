import { useTranslation } from 'react-i18next';
import { Search, Plus, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSettingsStore } from "../store/settingsStore";
import { usePromptStore } from "../store/promptStore";
import { cn } from "../lib/utils";

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useSettingsStore();
  const { setIsCreating, searchQuery, setSearchQuery } = usePromptStore();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'fa' : 'en';
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Search */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10",
              language === 'fa' && "pr-10 pl-3 text-right"
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Create Button */}
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('prompt.createNew')}
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={t('settings.theme.label')}
        >
          <ThemeIcon className="h-5 w-5" />
        </Button>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          title={t('settings.language.label')}
        >
          <Languages className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
