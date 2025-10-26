import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useToast } from '../hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

interface ImageUploaderProps {
  promptId?: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
}

export function ImageUploader({ promptId, onUploadComplete, maxFiles = 5 }: ImageUploaderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach((rejected) => {
        const { file, errors } = rejected;
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast({
              title: t('errors.fileTooLarge'),
              description: `${file.name} exceeds 5MB`,
              variant: 'destructive',
            });
          } else if (error.code === 'file-invalid-type') {
            toast({
              title: t('errors.invalidFileType'),
              description: `${file.name} is not a supported image format`,
              variant: 'destructive',
            });
          }
        });
      });

      // Add accepted files
      const newFiles: ImageFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles, toast, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles,
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFile = async (imageFile: ImageFile): Promise<void> => {
    if (!promptId) {
      throw new Error('Prompt ID is required for upload');
    }

    const formData = new FormData();
    formData.append('file', imageFile.file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.id === imageFile.id ? { ...f, progress } : f))
          );
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setFiles((prev) =>
            prev.map((f) => (f.id === imageFile.id ? { ...f, progress: 100 } : f))
          );
          resolve();
        } else {
          const error = `Upload failed: ${xhr.status}`;
          setFiles((prev) =>
            prev.map((f) => (f.id === imageFile.id ? { ...f, error } : f))
          );
          reject(new Error(error));
        }
      });

      xhr.addEventListener('error', () => {
        const error = 'Network error';
        setFiles((prev) =>
          prev.map((f) => (f.id === imageFile.id ? { ...f, error } : f))
        );
        reject(new Error(error));
      });

      xhr.open('POST', `http://127.0.0.1:3456/api/prompts/${promptId}/images`);
      xhr.send(formData);
    });
  };

  const uploadAll = async () => {
    if (!promptId) {
      toast({
        title: t('errors.error'),
        description: 'Please create the prompt first before uploading images',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload files sequentially
      for (const file of files) {
        if (file.progress === 0) {
          await uploadFile(file);
        }
      }

      toast({
        title: t('notifications.success'),
        description: `${files.length} image(s) uploaded successfully`,
      });

      onUploadComplete?.();
      setFiles([]);
    } catch (error) {
      toast({
        title: t('errors.uploadFailed'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">{t('prompt.dropImagesHere')}</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">{t('prompt.dragDropImages')}</p>
            <p className="text-sm text-muted-foreground">
              {t('prompt.supportedFormats')}: JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <div className="relative flex-shrink-0">
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-16 w-16 object-cover rounded"
                />
                {file.progress > 0 && file.progress < 100 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.file.name}</p>
                  <span className="text-xs text-muted-foreground">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                {file.error ? (
                  <p className="text-xs text-destructive">{file.error}</p>
                ) : file.progress > 0 ? (
                  <Progress value={file.progress} className="h-1.5" />
                ) : (
                  <p className="text-xs text-muted-foreground">{t('prompt.readyToUpload')}</p>
                )}
              </div>

              {!isUploading && file.progress === 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {file.progress === 100 && (
                <FileImage className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
            </div>
          ))}

          <Button
            onClick={uploadAll}
            disabled={isUploading || files.every((f) => f.progress === 100)}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('prompt.uploading')}...
              </>
            ) : (
              t('prompt.uploadImages')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
