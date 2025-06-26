import Joi from 'joi';

/**
 * Categories Validation Schemas
 * Validation rules for category management endpoints
 */

// Create category validation schema
export const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Category name is required',
    'string.min': 'Category name must be at least 1 character long',
    'string.max': 'Category name must not exceed 255 characters',
    'any.required': 'Category name is required'
  }),

  description: Joi.string().max(1000).required().messages({
    'string.empty': 'Description is required',
    'string.max': 'Description must not exceed 1000 characters',
    'any.required': 'Description is required'
  }),

  status: Joi.string().valid('active', 'inactive').default('active').messages({
    'any.only': 'Status must be either active or inactive'
  }),

  // File field for image uploads (added by multer middleware)
  file: Joi.any().optional()

  // Note: Image file uploads are handled by multer middleware
  // Either image file or imageUrl is required - validation handled in controller
});

// Update category validation schema
export const updateCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Category name cannot be empty',
    'string.min': 'Category name must be at least 1 character long',
    'string.max': 'Category name must not exceed 255 characters'
  }),

  description: Joi.string().max(1000).optional().messages({
    'string.empty': 'Description cannot be empty',
    'string.max': 'Description must not exceed 1000 characters'
  }),

  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Status must be either active or inactive'
  }),

  // File field for image uploads (added by multer middleware)
  file: Joi.any().optional()

  // Note: Image file uploads are now handled in the same endpoint via multer
  // Either image file or imageUrl can be provided, or neither for text-only updates
});

// Get categories validation schema (query parameters)
export const getCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100'
  }),
  
  search: Joi.string().optional().allow('').messages({
    'string.base': 'Search must be a string'
  }),
  
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Status filter must be either active or inactive'
  }),
  
  sort: Joi.string().valid('name', 'createdAt', 'updatedAt', 'productCount').default('updatedAt').messages({
    'any.only': 'Sort field must be one of: name, createdAt, updatedAt, productCount'
  }),
  
  order: Joi.string().valid('asc', 'desc').default('desc').messages({
    'any.only': 'Order must be either asc or desc'
  })
});

// Get single category validation schema
export const getCategorySchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID must be a number',
    'number.integer': 'Category ID must be an integer',
    'number.positive': 'Category ID must be positive',
    'any.required': 'Category ID is required'
  }),
  file: Joi.any().optional()

});

// Update category status validation schema
export const updateCategoryStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required().messages({
    'any.only': 'Status must be either active or inactive',
    'any.required': 'Status is required'
  })
});

// Get category products validation schema
export const getCategoryProductsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'Category ID must be a number',
    'number.integer': 'Category ID must be an integer',
    'number.positive': 'Category ID must be positive',
    'any.required': 'Category ID is required'
  })
});
