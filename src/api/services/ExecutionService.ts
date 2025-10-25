import prisma from '../../lib/prisma';
import type { ExecutePromptInput, ExecutionResult } from '../../types';

export class ExecutionService {
  async findByPromptId(promptId: string) {
    return prisma.execution.findMany({
      where: { promptId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });
  }

  async findById(id: string) {
    return prisma.execution.findUnique({
      where: { id },
      include: {
        prompt: true,
      },
    });
  }

  async execute(input: ExecutePromptInput): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        promptId: input.promptId,
        input: input.parameters ? JSON.stringify(input.parameters) : null,
        status: 'RUNNING',
      },
    });

    try {
      // Get the prompt
      const prompt = await prisma.prompt.findUnique({
        where: { id: input.promptId },
      });

      if (!prompt) {
        throw new Error('Prompt not found');
      }

      // Replace template variables in prompt content
      let processedContent = prompt.content;
      if (input.parameters) {
        Object.entries(input.parameters).forEach(([key, value]) => {
          const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          processedContent = processedContent.replace(regex, String(value));
        });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update execution with results
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          output: processedContent,
          status: 'SUCCESS',
          completedAt: new Date(),
          duration,
        },
      });

      // Increment prompt usage
      await prisma.prompt.update({
        where: { id: input.promptId },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      return {
        success: true,
        output: processedContent,
        metadata: {
          duration,
        },
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update execution with error
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMsg: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
          duration,
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration,
        },
      };
    }
  }
}
