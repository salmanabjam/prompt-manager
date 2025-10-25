import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PromptService } from '../services/PromptService';

const promptService = new PromptService();

export default async function promptRoutes(fastify: FastifyInstance) {
  // Get all prompts with filters
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, language, tags, sortBy, sortOrder, limit, offset } = request.query as any;
      
      const prompts = await promptService.findAll({
        type: type ? (Array.isArray(type) ? type : [type]) : undefined,
        language: language ? (Array.isArray(language) ? language : [language]) : undefined,
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
        sortBy: sortBy || 'updatedAt',
        sortOrder: sortOrder || 'desc',
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      });
      
      return prompts;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch prompts' });
    }
  });

  // Get single prompt by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const prompt = await promptService.findById(id);
      
      if (!prompt) {
        return reply.code(404).send({ error: 'Prompt not found' });
      }
      
      return prompt;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch prompt' });
    }
  });

  // Create new prompt
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      const prompt = await promptService.create(data);
      
      reply.code(201).send(prompt);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create prompt' });
    }
  });

  // Update prompt
  fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const data = request.body as any;
      
      const prompt = await promptService.update(id, data);
      
      if (!prompt) {
        return reply.code(404).send({ error: 'Prompt not found' });
      }
      
      return prompt;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to update prompt' });
    }
  });

  // Delete prompt (soft delete)
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await promptService.delete(id);
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete prompt' });
    }
  });

  // Duplicate prompt
  fastify.post('/:id/duplicate', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const newPrompt = await promptService.duplicate(id);
      
      if (!newPrompt) {
        return reply.code(404).send({ error: 'Prompt not found' });
      }
      
      reply.code(201).send(newPrompt);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to duplicate prompt' });
    }
  });

  // Increment usage count
  fastify.post('/:id/use', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await promptService.incrementUsage(id);
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to update usage count' });
    }
  });
}
