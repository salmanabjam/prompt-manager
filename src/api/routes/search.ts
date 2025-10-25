import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SearchService } from '../services/SearchService';

const searchService = new SearchService();

export default async function searchRoutes(fastify: FastifyInstance) {
  // Full-text search
  fastify.get('/text', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { query, ...filters } = request.query as any;
      
      if (!query) {
        return reply.code(400).send({ error: 'Query parameter is required' });
      }
      
      const results = await searchService.fullTextSearch(query, filters);
      return results;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to perform search' });
    }
  });

  // Semantic search
  fastify.get('/semantic', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { query, limit } = request.query as any;
      
      if (!query) {
        return reply.code(400).send({ error: 'Query parameter is required' });
      }
      
      const results = await searchService.semanticSearch(query, parseInt(limit) || 10);
      return results;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to perform semantic search' });
    }
  });
}
