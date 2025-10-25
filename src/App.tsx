import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from './store/settingsStore';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LibraryPage } from './pages/LibraryPage';
import { TagsPage } from './pages/TagsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { LogsPage } from './pages/LogsPage';
import { CreatePromptDialog } from './components/CreatePromptDialog';
import { Toaster } from 'sonner';
import './i18n/config';
import './styles.css';

function App() {
  const { i18n } = useTranslation();
  const { theme, language, density, currentPage } = useSettingsStore();

  useEffect(() => {
    // Apply theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  useEffect(() => {
    // Apply language
    i18n.changeLanguage(language);
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, i18n]);

  useEffect(() => {
    // Apply density
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const renderPage = () => {
    switch (currentPage) {
      case 'library':
        return <LibraryPage />;
      case 'tags':
        return <TagsPage />;
      case 'statistics':
        return <StatisticsPage />;
      case 'logs':
        return <LogsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <LibraryPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
      <CreatePromptDialog />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
