import multer from "multer";
import path from "path";

const allowedExtensions = [".txt", ".md"];

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error("Only plain text (.txt) and Markdown (.md) documents are supported"));
  }
  cb(null, true);
};

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});
