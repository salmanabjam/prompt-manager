/**
 * Database Test Suite
 * تست مستقیم عملیات CRUD با Prisma
 */

import { TestSuite, TestCase } from '../core/TestSimulator';
import { PrismaClient } from '@prisma/client';

export function createDatabaseTestSuite(): TestSuite {
  let prisma: PrismaClient;

  const tests: TestCase[] = [
    // Prompt CRUD - Create
    {
      id: 'db-001',
      name: 'Prisma - Create Prompt',
      description: 'Should create a new prompt in database',
      category: 'database',
      run: async (ctx) => {
        const prompt = await prisma.prompt.create({
          data: {
            title: 'DB Test Prompt ' + Date.now(),
            content: 'Direct database test',
            description: 'Created via Prisma',
            type: 'text',
          },
        });
        
        ctx.assert.isNotNull(prompt.id, 'Should generate ID');
        ctx.assert.isNotNull(prompt.createdAt, 'Should have createdAt');
        ctx.assert.isNotNull(prompt.updatedAt, 'Should have updatedAt');
        
        ctx.data.set('testPromptId', prompt.id);
        ctx.log.info(`Created prompt in DB: ${prompt.id}`);
      },
    },

    // Prompt CRUD - Read
    {
      id: 'db-002',
      name: 'Prisma - Read Prompt',
      description: 'Should read prompt from database',
      category: 'database',
      run: async (ctx) => {
        const promptId = ctx.data.get('testPromptId');
        ctx.assert.isDefined(promptId, 'Prompt ID should exist from previous test');
        
        const prompt = await prisma.prompt.findUnique({
          where: { id: promptId },
        });
        
        ctx.assert.isNotNull(prompt, 'Should find prompt');
        ctx.assert.equal(prompt?.id, promptId, 'IDs should match');
        ctx.log.info(`Read prompt: ${prompt?.title}`);
      },
    },

    // Prompt CRUD - Update
    {
      id: 'db-003',
      name: 'Prisma - Update Prompt',
      description: 'Should update prompt in database',
      category: 'database',
      run: async (ctx) => {
        const promptId = ctx.data.get('testPromptId');
        const newTitle = 'Updated Title ' + Date.now();
        
        const updated = await prisma.prompt.update({
          where: { id: promptId },
          data: { title: newTitle },
        });
        
        ctx.assert.equal(updated.title, newTitle, 'Title should be updated');
        ctx.assert.isTrue(
          updated.updatedAt > updated.createdAt,
          'updatedAt should be newer than createdAt'
        );
        
        ctx.log.info(`Updated prompt title to: ${newTitle}`);
      },
    },

    // Prompt CRUD - Delete
    {
      id: 'db-004',
      name: 'Prisma - Delete Prompt',
      description: 'Should delete prompt from database',
      category: 'database',
      run: async (ctx) => {
        const promptId = ctx.data.get('testPromptId');
        
        await prisma.prompt.delete({
          where: { id: promptId },
        });
        
        const deleted = await prisma.prompt.findUnique({
          where: { id: promptId },
        });
        
        ctx.assert.isNull(deleted, 'Prompt should be deleted');
        ctx.log.info(`Deleted prompt: ${promptId}`);
      },
    },

    // Tag CRUD - Create
    {
      id: 'db-005',
      name: 'Prisma - Create Tag',
      description: 'Should create a new tag in database',
      category: 'database',
      run: async (ctx) => {
        const tag = await prisma.tag.create({
          data: {
            name: 'db-test-tag-' + Date.now(),
            color: '#123456',
          },
        });
        
        ctx.assert.isNotNull(tag.id, 'Should generate ID');
        ctx.data.set('testTagId', tag.id);
        ctx.log.info(`Created tag: ${tag.name}`);
      },
    },

    // Tag CRUD - Read with count
    {
      id: 'db-006',
      name: 'Prisma - Read Tag with count',
      description: 'Should read tag with prompt count',
      category: 'database',
      run: async (ctx) => {
        const tagId = ctx.data.get('testTagId');
        
        const tag = await prisma.tag.findUnique({
          where: { id: tagId },
          include: {
            _count: {
              select: { prompts: true },
            },
          },
        });
        
        ctx.assert.isNotNull(tag, 'Should find tag');
        ctx.assert.hasProperty(tag, '_count', 'Should have _count');
        ctx.log.info(`Tag has ${tag?._count.prompts} prompts`);
      },
    },

    // Relations - Prompt with Tags
    {
      id: 'db-007',
      name: 'Prisma - Create Prompt with Tags',
      description: 'Should create prompt with multiple tags (many-to-many relation)',
      category: 'database',
      run: async (ctx) => {
        // Create tags first
        const tag1 = await prisma.tag.create({
          data: { name: 'relation-test-1', color: '#FF0000' },
        });
        const tag2 = await prisma.tag.create({
          data: { name: 'relation-test-2', color: '#00FF00' },
        });
        
        // Create prompt with tags
        const prompt = await prisma.prompt.create({
          data: {
            title: 'Prompt with Tags',
            content: 'Testing relations',
            type: 'text',
            tags: {
              connect: [{ id: tag1.id }, { id: tag2.id }],
            },
          },
          include: {
            tags: true,
          },
        });
        
        ctx.assert.lengthOf(prompt.tags, 2, 'Should have 2 tags');
        ctx.data.set('testPromptWithTagsId', prompt.id);
        ctx.log.info(`Created prompt with ${prompt.tags.length} tags`);
      },
    },

    // Version History
    {
      id: 'db-008',
      name: 'Prisma - Create Version History',
      description: 'Should save prompt version',
      category: 'database',
      run: async (ctx) => {
        const promptId = ctx.data.get('testPromptWithTagsId');
        
        const version = await prisma.version.create({
          data: {
            promptId: promptId,
            versionNumber: 1,
            content: 'Version 1 content',
            changeDescription: 'Initial version',
          },
        });
        
        ctx.assert.isNotNull(version.id, 'Should create version');
        ctx.assert.equal(version.versionNumber, 1, 'Version number should be 1');
        ctx.log.info(`Created version ${version.versionNumber} for prompt`);
      },
    },

    // Category Relations
    {
      id: 'db-009',
      name: 'Prisma - Create Category',
      description: 'Should create category and assign prompts',
      category: 'database',
      run: async (ctx) => {
        const category = await prisma.category.create({
          data: {
            name: 'Test Category',
            description: 'For testing',
          },
        });
        
        ctx.assert.isNotNull(category.id, 'Should create category');
        ctx.data.set('testCategoryId', category.id);
        ctx.log.info(`Created category: ${category.name}`);
      },
    },

    // Complex Query - Find prompts by tag
    {
      id: 'db-010',
      name: 'Prisma - Query prompts by tag',
      description: 'Should find all prompts with specific tag',
      category: 'database',
      run: async (ctx) => {
        const prompts = await prisma.prompt.findMany({
          where: {
            tags: {
              some: {
                name: {
                  contains: 'relation-test',
                },
              },
            },
          },
          include: {
            tags: true,
          },
        });
        
        ctx.assert.isTrue(prompts.length > 0, 'Should find prompts with tag');
        ctx.log.info(`Found ${prompts.length} prompts with matching tag`);
      },
    },

    // Transaction Test
    {
      id: 'db-011',
      name: 'Prisma - Transaction (atomic operations)',
      description: 'Should execute multiple operations atomically',
      category: 'database',
      run: async (ctx) => {
        const result = await prisma.$transaction(async (tx) => {
          const prompt = await tx.prompt.create({
            data: {
              title: 'Transaction Test',
              content: 'Atomic operation',
              type: 'text',
            },
          });
          
          const tag = await tx.tag.create({
            data: {
              name: 'transaction-tag',
              color: '#000000',
            },
          });
          
          return { prompt, tag };
        });
        
        ctx.assert.isNotNull(result.prompt, 'Prompt should be created');
        ctx.assert.isNotNull(result.tag, 'Tag should be created');
        ctx.log.info('Transaction completed successfully');
      },
    },

    // Count aggregation
    {
      id: 'db-012',
      name: 'Prisma - Count aggregation',
      description: 'Should count prompts by type',
      category: 'database',
      run: async (ctx) => {
        const counts = await prisma.prompt.groupBy({
          by: ['type'],
          _count: {
            id: true,
          },
        });
        
        ctx.assert.isTrue(Array.isArray(counts), 'Should return array');
        ctx.log.info(`Found ${counts.length} different prompt types`);
        counts.forEach(c => {
          ctx.log.verbose(`Type ${c.type}: ${c._count.id} prompts`);
        });
      },
    },

    // Search test
    {
      id: 'db-013',
      name: 'Prisma - Full-text search',
      description: 'Should search prompts by title or content',
      category: 'database',
      run: async (ctx) => {
        const searchTerm = 'test';
        const prompts = await prisma.prompt.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { content: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        });
        
        ctx.assert.isTrue(prompts.length > 0, 'Should find prompts');
        ctx.log.info(`Found ${prompts.length} prompts matching "${searchTerm}"`);
      },
    },

    // Pagination test
    {
      id: 'db-014',
      name: 'Prisma - Pagination',
      description: 'Should paginate results correctly',
      category: 'database',
      run: async (ctx) => {
        const pageSize = 2;
        const page1 = await prisma.prompt.findMany({
          take: pageSize,
          skip: 0,
          orderBy: { createdAt: 'desc' },
        });
        
        const page2 = await prisma.prompt.findMany({
          take: pageSize,
          skip: pageSize,
          orderBy: { createdAt: 'desc' },
        });
        
        ctx.assert.isTrue(page1.length <= pageSize, 'Page 1 should respect limit');
        ctx.assert.isTrue(page2.length <= pageSize, 'Page 2 should respect limit');
        
        if (page1.length > 0 && page2.length > 0) {
          ctx.assert.notEqual(page1[0].id, page2[0].id, 'Pages should have different items');
        }
        
        ctx.log.info(`Page 1: ${page1.length} items, Page 2: ${page2.length} items`);
      },
    },

    // Cascade delete test
    {
      id: 'db-015',
      name: 'Prisma - Cascade delete',
      description: 'Should cascade delete related records',
      category: 'database',
      run: async (ctx) => {
        // Create prompt with version
        const prompt = await prisma.prompt.create({
          data: {
            title: 'Cascade Test',
            content: 'Will be deleted',
            type: 'text',
            versions: {
              create: {
                versionNumber: 1,
                content: 'Version content',
              },
            },
          },
        });
        
        // Delete prompt (should cascade to versions)
        await prisma.prompt.delete({
          where: { id: prompt.id },
        });
        
        // Check if version was deleted
        const versions = await prisma.version.findMany({
          where: { promptId: prompt.id },
        });
        
        ctx.assert.lengthOf(versions, 0, 'Versions should be cascade deleted');
        ctx.log.info('Cascade delete works correctly');
      },
    },
  ];

  return {
    id: 'database-suite',
    name: 'Database Test Suite',
    description: 'Direct Prisma database operations testing',
    tests,
    setup: async () => {
      console.log('💾 Initializing Prisma Client...');
      prisma = new PrismaClient({
        log: ['error'],
      });
      await prisma.$connect();
      console.log('✅ Connected to database');
    },
    teardown: async () => {
      console.log('🔌 Disconnecting from database...');
      await prisma.$disconnect();
      console.log('✅ Database tests completed');
    },
  };
}
