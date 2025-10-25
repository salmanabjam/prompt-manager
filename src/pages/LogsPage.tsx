import { useState, useEffect } from 'react';
import { logger, LogLevel, LogCategory, LogEntry } from '../lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Bug, Info, AlertTriangle, XCircle, Download, Trash2, RefreshCw } from 'lucide-react';

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<{
    level?: LogLevel;
    category?: LogCategory;
    search?: string;
  }>({});

  const loadLogs = () => {
    const filtered = logger.getLogs({
      level: filter.level,
      category: filter.category,
    });

    let result = filtered;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      result = filtered.filter(
        log =>
          log.message.toLowerCase().includes(search) ||
          log.component?.toLowerCase().includes(search)
      );
    }

    setLogs(result);
  };

  useEffect(() => {
    loadLogs();
    const unsubscribe = logger.subscribe(() => {
      loadLogs();
    });
    return unsubscribe;
  }, [filter]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4" />;
      case LogLevel.INFO:
        return <Info className="h-4 w-4" />;
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4" />;
      case LogLevel.ERROR:
        return <XCircle className="h-4 w-4" />;
      case LogLevel.CRITICAL:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG:
        return 'bg-gray-500';
      case LogLevel.INFO:
        return 'bg-blue-500';
      case LogLevel.WARN:
        return 'bg-yellow-500';
      case LogLevel.ERROR:
        return 'bg-red-500';
      case LogLevel.CRITICAL:
        return 'bg-purple-500';
    }
  };

  const handleExport = () => {
    const data = logger.exportLogs('json');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    a.click();
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs();
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">{logs.length} log entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search logs..."
                value={filter.search || ''}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div>
              <Select
                value={filter.level || 'all'}
                onValueChange={value =>
                  setFilter({ ...filter, level: value === 'all' ? undefined : (value as LogLevel) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={LogLevel.DEBUG}>Debug</SelectItem>
                  <SelectItem value={LogLevel.INFO}>Info</SelectItem>
                  <SelectItem value={LogLevel.WARN}>Warning</SelectItem>
                  <SelectItem value={LogLevel.ERROR}>Error</SelectItem>
                  <SelectItem value={LogLevel.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={filter.category || 'all'}
                onValueChange={value =>
                  setFilter({ ...filter, category: value === 'all' ? undefined : (value as LogCategory) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value={LogCategory.API}>API</SelectItem>
                  <SelectItem value={LogCategory.DATABASE}>Database</SelectItem>
                  <SelectItem value={LogCategory.UI}>UI</SelectItem>
                  <SelectItem value={LogCategory.NETWORK}>Network</SelectItem>
                  <SelectItem value={LogCategory.VALIDATION}>Validation</SelectItem>
                  <SelectItem value={LogCategory.SYSTEM}>System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries */}
      <div className="space-y-2">
        {logs.map(log => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-full ${getLevelColor(log.level)} text-white`}>
                  {getLevelIcon(log.level)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.level}</Badge>
                      <Badge variant="secondary">{log.category}</Badge>
                      {log.component && <Badge>{log.component}</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.context && (
                    <p className="text-sm text-muted-foreground">{log.context}</p>
                  )}
                  {log.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground text-red-500">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded overflow-x-auto text-red-900 dark:text-red-100">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {logs.length === 0 && (
          <Card className="py-12">
            <div className="text-center">
              <Info className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Logs Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
