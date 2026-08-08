import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createStorage = (subdir) =>
  multer.diskStorage({
    destination(_req, _file, cb) {
      const dest = path.join(__dirname, '..', env.uploadDir, subdir);
      ensureDir(dest);
      cb(null, dest);
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
        ? ext
        : '.jpg';
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${safeExt}`);
    },
  });

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new ApiError(
        400,
        'Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed',
      ),
      false,
    );
  }
  return cb(null, true);
};

const maxBytes = env.maxFileSizeMb * 1024 * 1024;

/**
 * Single image upload middleware.
 * Rejects non-images and oversized files.
 */
export const uploadImage = (subdir = 'pizzas', fieldName = 'image') => {
  const uploader = multer({
    storage: createStorage(subdir),
    fileFilter,
    limits: { fileSize: maxBytes, files: 1 },
  }).single(fieldName);

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (!err) {
        return next();
      }

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ApiError(
              400,
              `Image too large. Maximum size is ${env.maxFileSizeMb}MB`,
            ),
          );
        }
        return next(new ApiError(400, err.message));
      }

      return next(err);
    });
  };
};

/**
 * Builds a public URL path for a stored upload.
 */
export const toUploadPath = (subdir, filename) =>
  filename ? `/uploads/${subdir}/${filename}` : null;
