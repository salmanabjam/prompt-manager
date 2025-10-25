import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SettingsService } from '../services/SettingsService';

const settingsService = new SettingsService();

export default async function settingsRoutes(fastify: FastifyInstance) {
  // Get all settings
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await settingsService.getAll();
      return settings;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch settings' });
    }
  });

  // Get specific setting
  fastify.get('/:key', async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    try {
      const { key } = request.params;
      const setting = await settingsService.get(key);
      
      if (!setting) {
        return reply.code(404).send({ error: 'Setting not found' });
      }
      
      return setting;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch setting' });
    }
  });

  // Update setting
  fastify.put('/:key', async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    try {
      const { key } = request.params;
      const { value } = request.body as any;
      
      const setting = await settingsService.set(key, value);
      return setting;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to update setting' });
    }
  });
}
