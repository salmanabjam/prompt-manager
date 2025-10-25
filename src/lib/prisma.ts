import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.cachedPrisma;
}

export default prisma;

// Type exports for convenience
export type { 
  Prompt, 
  PromptVersion, 
  Tag, 
  PromptTag, 
  Execution, 
  Embedding,
  AppSettings,
  PromptType,
  Language,
  ExecutionStatus
} from '@prisma/client';
