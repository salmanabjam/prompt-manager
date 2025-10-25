import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';

export function StatisticsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('statistics.title')}</h1>
        <p className="text-muted-foreground">
          View analytics and usage statistics
        </p>
      </div>

      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Statistics Dashboard</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
