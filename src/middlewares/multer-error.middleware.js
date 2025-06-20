import multer from 'multer';

/**
 * Multer Error Handling Middleware
 * Handles multer-specific errors and provides user-friendly messages
 */
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum file size is 5MB per file.'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files allowed per upload.'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "images" as the field name for file uploads.'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }
  
  // Handle custom file filter errors
  if (error.message && error.message.includes('Invalid file format')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  // Pass other errors to the next error handler
  next(error);
};
