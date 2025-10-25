import { Prompt, PromptVersion, Tag, Execution, PromptType, Language, ExecutionStatus } from '@prisma/client';

/**
 * Extended Prompt type with relations
 */
export interface PromptWithRelations extends Prompt {
  tags: Array<{ tag: Tag }>;
  versions: PromptVersion[];
  executions: Execution[];
  _count?: {
    versions: number;
    executions: number;
  };
}

/**
 * Prompt creation input
 */
export interface CreatePromptInput {
  title: string;
  description?: string;
  content: string;
  type: PromptType;
  language?: Language;
  tags?: string[]; // Tag names or IDs
}

/**
 * Prompt update input
 */
export interface UpdatePromptInput {
  title?: string;
  description?: string;
  content?: string;
  type?: PromptType;
  language?: Language;
  tags?: string[];
}

/**
 * Search filters
 */
export interface SearchFilters {
  query?: string;
  type?: PromptType[];
  language?: Language[];
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'title' | 'updatedAt' | 'createdAt' | 'usageCount';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  prompt: PromptWithRelations;
  score: number; // Relevance score (0-1)
  highlights?: {
    title?: string;
    description?: string;
    content?: string;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Tag with usage count
 */
export interface TagWithCount extends Tag {
  _count: {
    prompts: number;
  };
}

/**
 * Execution input
 */
export interface ExecutePromptInput {
  promptId: string;
  parameters?: Record<string, any>;
  config?: {
    timeout?: number;
    memoryLimit?: number;
  };
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  metadata: {
    duration: number;
    memoryUsed?: number;
    tokensUsed?: number;
  };
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Density mode for UI spacing
 */
export type DensityMode = 'compact' | 'comfortable' | 'spacious';

/**
 * App settings
 */
export interface AppSettingsType {
  theme: ThemeMode;
  language: Language;
  density: DensityMode;
  semanticSearch: boolean;
  autoSave: boolean;
  autoVersion: boolean;
}

/**
 * Version diff
 */
export interface VersionDiff {
  additions: number;
  deletions: number;
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    line: number;
    content: string;
  }>;
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'markdown' | 'csv' | 'txt';

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    index: number;
    reason: string;
  }>;
}

/**
 * Statistics
 */
export interface Statistics {
  totalPrompts: number;
  totalTags: number;
  totalExecutions: number;
  promptsByType: Record<PromptType, number>;
  promptsByLanguage: Record<Language, number>;
  mostUsedPrompts: Array<{
    prompt: Prompt;
    usageCount: number;
  }>;
  mostUsedTags: Array<{
    tag: Tag;
    count: number;
  }>;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Notification type
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  promptId?: string;
}

/**
 * Sidebar state
 */
export interface SidebarState {
  isCollapsed: boolean;
  activeSection?: 'library' | 'tags' | 'recent' | 'favorites';
}

/**
 * Editor state
 */
export interface EditorState {
  content: string;
  isDirty: boolean;
  cursorPosition: { line: number; column: number };
  selection?: { start: number; end: number };
}
