import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { logger, LogCategory } from './logger';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const THUMBNAILS_DIR = path.join(UPLOADS_DIR, 'thumbnails');

// Supported image MIME types
export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Maximum file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Maximum image dimensions
export const MAX_IMAGE_DIMENSION = 4096;

// Thumbnail size
export const THUMBNAIL_SIZE = 200;

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface SavedImage {
  storedName: string;
  path: string;
  thumbnail: string;
  metadata: ImageMetadata;
}

/**
 * Initialize upload directories
 */
export async function initializeUploadDirs(): Promise<void> {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
    logger.info(LogCategory.STORAGE, 'Upload directories initialized', {
      images: IMAGES_DIR,
      thumbnails: THUMBNAILS_DIR,
    });
  } catch (error) {
    logger.error(
      LogCategory.STORAGE,
      'Failed to initialize upload directories',
      error as Error,
      { images: IMAGES_DIR, thumbnails: THUMBNAILS_DIR }
    );
    throw error;
  }
}

/**
 * Validate image file
 */
export async function validateImage(buffer: Buffer, mimeType: string): Promise<void> {
  // Check MIME type
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Unsupported image type: ${mimeType}. Supported types: ${SUPPORTED_MIME_TYPES.join(', ')}`
    );
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum: ${buffer.length} bytes (max: ${MAX_FILE_SIZE} bytes)`
    );
  }

  // Validate image using sharp
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: unable to read dimensions');
    }

    // Check dimensions
    if (metadata.width > MAX_IMAGE_DIMENSION || metadata.height > MAX_IMAGE_DIMENSION) {
      throw new Error(
        `Image dimensions exceed maximum: ${metadata.width}x${metadata.height} (max: ${MAX_IMAGE_DIMENSION}x${MAX_IMAGE_DIMENSION})`
      );
    }
  } catch (error) {
    logger.error(LogCategory.VALIDATION, 'Image validation failed', error as Error, {
      mimeType,
      size: buffer.length,
    });
    throw error;
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  } catch (error) {
    logger.error(LogCategory.STORAGE, 'Failed to read image metadata', error as Error);
    throw error;
  }
}

/**
 * Convert Windows path to URL path (replace backslashes with forward slashes)
 */
function toUrlPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(
  buffer: Buffer,
  storedName: string
): Promise<string> {
  try {
    const thumbnailName = `thumb_${storedName}`;
    const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailName);

    await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    logger.info(LogCategory.STORAGE, 'Thumbnail generated', {
      original: storedName,
      thumbnail: thumbnailName,
      size: `${THUMBNAIL_SIZE}x${THUMBNAIL_SIZE}`,
    });

    // Return URL-safe path
    return toUrlPath(path.join('uploads', 'thumbnails', thumbnailName));
  } catch (error) {
    logger.error(
      LogCategory.STORAGE,
      'Failed to generate thumbnail',
      error as Error,
      { storedName }
    );
    throw error;
  }
}

/**
 * Save image file
 */
export async function saveImage(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string
): Promise<SavedImage> {
  try {
    // Validate image
    await validateImage(buffer, mimeType);

    // Generate unique filename
    const ext = path.extname(originalFilename);
    const storedName = `${uuidv4()}${ext}`;
    const imagePath = path.join(IMAGES_DIR, storedName);

    // Save original image
    await fs.writeFile(imagePath, buffer);

    // Generate thumbnail
    const thumbnailPath = await generateThumbnail(buffer, storedName);

    // Get metadata
    const metadata = await getImageMetadata(buffer);

    logger.info(LogCategory.STORAGE, 'Image saved successfully', {
      original: originalFilename,
      stored: storedName,
      size: metadata.size,
      dimensions: `${metadata.width}x${metadata.height}`,
    });

    return {
      storedName,
      path: toUrlPath(path.join('uploads', 'images', storedName)),
      thumbnail: thumbnailPath,
      metadata,
    };
  } catch (error) {
    logger.error(
      LogCategory.STORAGE,
      'Failed to save image',
      error as Error,
      { filename: originalFilename, mimeType }
    );
    throw error;
  }
}

/**
 * Delete image file
 */
export async function deleteImage(imagePath: string, thumbnailPath: string): Promise<void> {
  try {
    const fullImagePath = path.join(process.cwd(), imagePath);
    const fullThumbnailPath = path.join(process.cwd(), thumbnailPath);

    // Delete files if they exist
    await Promise.all([
      fs.unlink(fullImagePath).catch(() => {}),
      fs.unlink(fullThumbnailPath).catch(() => {}),
    ]);

    logger.info(LogCategory.STORAGE, 'Image deleted', {
      image: imagePath,
      thumbnail: thumbnailPath,
    });
  } catch (error) {
    logger.error(
      LogCategory.STORAGE,
      'Failed to delete image',
      error as Error,
      { imagePath, thumbnailPath }
    );
    throw error;
  }
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  
  // Remove any non-alphanumeric characters except dots, dashes, and underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
