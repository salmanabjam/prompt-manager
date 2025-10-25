import prisma from '../../lib/prisma';
import type { SearchFilters, SearchResult } from '../../types';

export class SearchService {
  async fullTextSearch(query: string, filters: SearchFilters = {}) {
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
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
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
      data: prompts.map((prompt) => ({
        prompt,
        score: this.calculateRelevanceScore(prompt, query),
      })),
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  async semanticSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
    // TODO: Implement semantic search with Transformers.js
    // For now, fallback to full-text search
    const result = await this.fullTextSearch(query, { limit });
    return result.data;
  }

  private calculateRelevanceScore(prompt: any, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (prompt.title.toLowerCase().includes(lowerQuery)) {
      score += 0.5;
    }

    // Description match (medium weight)
    if (prompt.description?.toLowerCase().includes(lowerQuery)) {
      score += 0.3;
    }

    // Content match (lower weight)
    if (prompt.content.toLowerCase().includes(lowerQuery)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }
}
