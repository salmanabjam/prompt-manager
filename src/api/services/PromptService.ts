import prisma from '../../lib/prisma';
import type { CreatePromptInput, UpdatePromptInput, SearchFilters, PromptWithRelations } from '../../types';

export class PromptService {
  async findAll(filters: SearchFilters = {}) {
    const {
      type,
      language,
      tags,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = filters;

    const where: any = {
      deletedAt: null,
    };

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (language && language.length > 0) {
      where.language = { in: language };
    }

    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tags },
          },
        },
      };
    }

    const [prompts, total] = await Promise.all([
      prisma.prompt.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              versions: true,
              executions: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.prompt.count({ where }),
    ]);

    return {
      data: prompts,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async findById(id: string): Promise<PromptWithRelations | null> {
    return prisma.prompt.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            versions: true,
            executions: true,
          },
        },
      },
    }) as Promise<PromptWithRelations | null>;
  }

  async create(data: CreatePromptInput) {
    const { tags, ...promptData } = data;

    const prompt = await prisma.prompt.create({
      data: {
        ...promptData,
        tags: tags
          ? {
              create: tags.map((tagName) => ({
                tag: {
                  connectOrCreate: {
                    where: { name: tagName },
                    create: {
                      name: tagName,
                      color: this.generateColor(),
                    },
                  },
                },
              })),
            }
          : undefined,
        versions: {
          create: {
            versionNumber: 1,
            content: promptData.content,
            changeLog: 'Initial version',
          },
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        versions: true,
      },
    });

    return prompt;
  }

  async update(id: string, data: UpdatePromptInput) {
    const { tags, content, ...updateData } = data;

    // If content changed, create a new version
    let versionUpdate = {};
    if (content) {
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id },
        select: { content: true },
      });

      if (existingPrompt && existingPrompt.content !== content) {
        const latestVersion = await prisma.promptVersion.findFirst({
          where: { promptId: id },
          orderBy: { versionNumber: 'desc' },
        });

        versionUpdate = {
          versions: {
            create: {
              versionNumber: (latestVersion?.versionNumber || 0) + 1,
              content,
              changeLog: 'Auto-saved version',
            },
          },
        };
      }
    }

    // Handle tags
    let tagsUpdate = {};
    if (tags) {
      // Remove all existing tags
      await prisma.promptTag.deleteMany({
        where: { promptId: id },
      });

      // Add new tags
      tagsUpdate = {
        tags: {
          create: tags.map((tagName) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: {
                  name: tagName,
                  color: this.generateColor(),
                },
              },
            },
          })),
        },
      };
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        ...updateData,
        ...(content ? { content } : {}),
        ...versionUpdate,
        ...tagsUpdate,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return prompt;
  }

  async delete(id: string) {
    // Soft delete
    await prisma.prompt.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async duplicate(id: string) {
    const original = await this.findById(id);
    if (!original) return null;

    const tagNames = original.tags.map((pt) => pt.tag.name);

    return this.create({
      title: `${original.title} (Copy)`,
      description: original.description || undefined,
      content: original.content,
      type: original.type as any,
      language: original.language as any,
      tags: tagNames,
    });
  }

  async incrementUsage(id: string) {
    await prisma.prompt.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  private generateColor(): string {
    const colors = [
      '#6366F1',
      '#8B5CF6',
      '#EC4899',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#EF4444',
      '#14B8A6',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
