import { memoryStorage } from 'multer';

export const multerConfig = {
  storage: memoryStorage(),
};

export const multerOptions = {
  limits: { fileSize: 5 * 1024 * 1024 },
};
