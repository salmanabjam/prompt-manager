import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ExecutionService } from '../services/ExecutionService';

const executionService = new ExecutionService();

export default async function executionRoutes(fastify: FastifyInstance) {
  // Get executions for a prompt
  fastify.get('/prompt/:promptId', async (request: FastifyRequest<{ Params: { promptId: string } }>, reply: FastifyReply) => {
    try {
      const { promptId } = request.params;
      const executions = await executionService.findByPromptId(promptId);
      
      return executions;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch executions' });
    }
  });

  // Get execution by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const execution = await executionService.findById(id);
      
      if (!execution) {
        return reply.code(404).send({ error: 'Execution not found' });
      }
      
      return execution;
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to fetch execution' });
    }
  });

  // Execute a prompt
  fastify.post('/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      const result = await executionService.execute(data);
      
      reply.code(201).send(result);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Failed to execute prompt' });
    }
  });
}
