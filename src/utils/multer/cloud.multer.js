import multer from "multer";

export const fileValidations = {
    Image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    Document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
};

export const uploadCloudFile = (extensions = fileValidations.Image) => {
  // Use memory storage to get file buffer for Cloudinary upload
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (extensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format! Allowed formats: ${extensions.join(', ')}`), false);
    }
  };

  // Set file size limit (5MB per file)
  const limits = {
    fileSize: 5 * 1024 * 1024 // 5MB
  };

  return multer({
    storage,
    fileFilter,
    limits
  });
};