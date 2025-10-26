import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MultipartFile } from '@fastify/multipart';
import prisma from '../../lib/prisma';
import {
  saveImage,
  deleteImage,
  sanitizeFilename,
  SUPPORTED_MIME_TYPES,
} from '../../lib/fileStorage';
import { logger, LogCategory } from '../../lib/logger';

interface UploadParams {
  id: string; // promptId
}

interface DeleteParams {
  id: string; // imageId
}

export async function imageRoutes(fastify: FastifyInstance) {
  // Upload image to a prompt
  fastify.post<{ Params: UploadParams }>(
    '/prompts/:id/images',
    async (request: FastifyRequest<{ Params: UploadParams }>, reply: FastifyReply) => {
      const { id: promptId } = request.params;

      try {
        logger.apiRequest('POST', `/api/prompts/${promptId}/images`, {});

        // Check if prompt exists
        const prompt = await prisma.prompt.findUnique({
          where: { id: promptId, deletedAt: null },
        });

        if (!prompt) {
          logger.apiError(
            'POST',
            `/api/prompts/${promptId}/images`,
            new Error('Prompt not found')
          );
          return reply.status(404).send({ error: 'Prompt not found' });
        }

        // Get uploaded file
        const data = await request.file();
        
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        const file = data as MultipartFile;
        const buffer = await file.toBuffer();
        const mimeType = file.mimetype;
        const originalFilename = sanitizeFilename(file.filename);

        // Validate MIME type
        if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
          return reply.status(400).send({
            error: `Unsupported file type: ${mimeType}`,
            supported: SUPPORTED_MIME_TYPES,
          });
        }

        // Save image and generate thumbnail
        const savedImage = await saveImage(buffer, originalFilename, mimeType);

        // Save to database
        const promptImage = await prisma.promptImage.create({
          data: {
            promptId,
            filename: originalFilename,
            storedName: savedImage.storedName,
            mimeType,
            size: savedImage.metadata.size,
            path: savedImage.path,
            thumbnail: savedImage.thumbnail,
            width: savedImage.metadata.width,
            height: savedImage.metadata.height,
          },
        });

        logger.apiSuccess('POST', `/api/prompts/${promptId}/images`, promptImage);

        return reply.status(201).send(promptImage);
      } catch (error) {
        logger.error(
          LogCategory.API,
          'Failed to upload image',
          error as Error,
          {
            component: 'ImageRoutes',
            action: 'uploadImage',
            context: `Uploading image to prompt ${promptId}`,
          }
        );

        return reply.status(500).send({
          error: 'Failed to upload image',
          message: (error as Error).message,
        });
      }
    }
  );

  // Get images for a prompt
  fastify.get<{ Params: UploadParams }>(
    '/prompts/:id/images',
    async (request: FastifyRequest<{ Params: UploadParams }>, reply: FastifyReply) => {
      const { id: promptId } = request.params;

      try {
        logger.apiRequest('GET', `/api/prompts/${promptId}/images`, {});

        const images = await prisma.promptImage.findMany({
          where: { promptId },
          orderBy: { createdAt: 'desc' },
        });

        logger.apiSuccess('GET', `/api/prompts/${promptId}/images`, { count: images.length });

        return reply.send({ data: images });
      } catch (error) {
        logger.error(
          LogCategory.API,
          'Failed to fetch images',
          error as Error,
          {
            component: 'ImageRoutes',
            action: 'getImages',
            context: `Fetching images for prompt ${promptId}`,
          }
        );

        return reply.status(500).send({
          error: 'Failed to fetch images',
          message: (error as Error).message,
        });
      }
    }
  );

  // Delete an image
  fastify.delete<{ Params: DeleteParams }>(
    '/images/:id',
    async (request: FastifyRequest<{ Params: DeleteParams }>, reply: FastifyReply) => {
      const { id: imageId } = request.params;

      try {
        logger.apiRequest('DELETE', `/api/images/${imageId}`, {});

        // Find image
        const image = await prisma.promptImage.findUnique({
          where: { id: imageId },
        });

        if (!image) {
          logger.apiError('DELETE', `/api/images/${imageId}`, new Error('Image not found'));
          return reply.status(404).send({ error: 'Image not found' });
        }

        // Delete files from storage
        await deleteImage(image.path, image.thumbnail);

        // Delete from database
        await prisma.promptImage.delete({
          where: { id: imageId },
        });

        logger.apiSuccess('DELETE', `/api/images/${imageId}`, { id: imageId });

        return reply.status(204).send();
      } catch (error) {
        logger.error(
          LogCategory.API,
          'Failed to delete image',
          error as Error,
          {
            component: 'ImageRoutes',
            action: 'deleteImage',
            context: `Deleting image ${imageId}`,
          }
        );

        return reply.status(500).send({
          error: 'Failed to delete image',
          message: (error as Error).message,
        });
      }
    }
  );
}
