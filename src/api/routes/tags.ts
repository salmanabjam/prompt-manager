import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TagService } from '../services/TagService';

const tagService = new TagService();

export default async function tagRoutes(fastify: FastifyInstance) {
  // Get all tags
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const tags = await tagService.findAll();
      return tags;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch tags' });
    }
  });

  // Get tag by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const tag = await tagService.findById(id);
      
      if (!tag) {
        return reply.code(404).send({ error: 'Tag not found' });
      }
      
      return tag;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch tag' });
    }
  });

  // Create new tag
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      const tag = await tagService.create(data);
      
      reply.code(201).send(tag);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create tag' });
    }
  });

  // Update tag
  fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const data = request.body as any;
      
      const tag = await tagService.update(id, data);
      
      if (!tag) {
        return reply.code(404).send({ error: 'Tag not found' });
      }
      
      return tag;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to update tag' });
    }
  });

  // Delete tag
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      await tagService.delete(id);
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to delete tag' });
    }
  });
}
