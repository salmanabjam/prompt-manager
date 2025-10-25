import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VersionService } from '../services/VersionService';

const versionService = new VersionService();

export default async function versionRoutes(fastify: FastifyInstance) {
  // Get all versions for a prompt
  fastify.get('/prompt/:promptId', async (request: FastifyRequest<{ Params: { promptId: string } }>, reply: FastifyReply) => {
    try {
      const { promptId } = request.params;
      const versions = await versionService.findByPromptId(promptId);
      
      return versions;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch versions' });
    }
  });

  // Get specific version
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const version = await versionService.findById(id);
      
      if (!version) {
        return reply.code(404).send({ error: 'Version not found' });
      }
      
      return version;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch version' });
    }
  });

  // Create new version
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      const version = await versionService.create(data);
      
      reply.code(201).send(version);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to create version' });
    }
  });

  // Restore version (make it current)
  fastify.post('/:id/restore', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const result = await versionService.restore(id);
      
      if (!result) {
        return reply.code(404).send({ error: 'Version not found' });
      }
      
      return result;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to restore version' });
    }
  });
}
