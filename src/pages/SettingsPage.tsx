import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Sun, Moon, Monitor, Languages } from 'lucide-react';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme, language, setLanguage, density, setDensity } = useSettingsStore();

  const themes = [
    { value: 'light', label: t('settings.theme.light'), icon: Sun },
    { value: 'dark', label: t('settings.theme.dark'), icon: Moon },
    { value: 'system', label: t('settings.theme.system'), icon: Monitor },
  ] as const;

  const languages = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'fa', label: 'فارسی', flag: '🇮🇷' },
  ] as const;

  const densities = [
    { value: 'compact', label: t('settings.density.compact') },
    { value: 'comfortable', label: t('settings.density.comfortable') },
    { value: 'spacious', label: t('settings.density.spacious') },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          Customize your application preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
            <CardDescription>{t('settings.theme.label')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.theme.label')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {themes.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={theme === value ? 'default' : 'outline'}
                    className="flex-col gap-2 h-auto py-3"
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.general')}</CardTitle>
            <CardDescription>{t('settings.language.label')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.language.label')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map(({ value, label, flag }) => (
                  <Button
                    key={value}
                    variant={language === value ? 'default' : 'outline'}
                    className="justify-start gap-2"
                    onClick={() => setLanguage(value)}
                  >
                    <span className="text-xl">{flag}</span>
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Density Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.editor')}</CardTitle>
            <CardDescription>{t('settings.density.label')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('settings.density.label')}</Label>
              <div className="grid grid-cols-3 gap-2">
                {densities.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={density === value ? 'default' : 'outline'}
                    className={cn(
                      "h-auto",
                      value === 'compact' && "py-2",
                      value === 'comfortable' && "py-3",
                      value === 'spacious' && "py-4"
                    )}
                    onClick={() => setDensity(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">Tauri 2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Database</span>
              <span className="font-medium">SQLite + Prisma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">UI</span>
              <span className="font-medium">React + shadcn/ui</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
