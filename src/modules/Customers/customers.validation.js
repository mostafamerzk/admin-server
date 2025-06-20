import Joi from 'joi';

/**
 * Customer Validation Schemas
 * Based on the actual Users and Customer models from Prisma schema
 */

// Helper function to validate GUID format for user IDs
const isValidGuid = (value, helpers) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Create customer validation schema
export const createCustomerSchema = Joi.object({
  Name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),
  
  Email: Joi.string()
    .email()
    .max(256)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 256 characters',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  
  PhoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  Address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  
  BusinessType: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Business type must not exceed 100 characters'
    }),
  
  verificationStatus: Joi.string()
    .valid('pending', 'verified', 'rejected')
    .default('pending')
    .optional()
});

// Update customer validation schema (all fields optional except those being updated)
export const updateCustomerSchema = Joi.object({
  Name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 255 characters'
    }),
  
  Email: Joi.string()
    .email()
    .max(256)
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 256 characters'
    }),
  
  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      'string.min': 'Password must be at least 6 characters long'
    }),
  
  PhoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  Address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  
  BusinessType: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Business type must not exceed 100 characters'
    }),
  
  verificationStatus: Joi.string()
    .valid('pending', 'verified', 'rejected')
    .optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Get customers list validation schema
export const getCustomersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
  
  search: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search term must not exceed 255 characters'
    }),
  
  status: Joi.string()
    .valid('active', 'banned')
    .optional(),
  
  sort: Joi.string()
    .valid('Name', 'Email', 'createdAt', 'updatedAt')
    .default('updatedAt')
    .optional(),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

// Get single customer validation schema
export const getCustomerSchema = Joi.object({
  id: Joi.string()
    .custom(isValidGuid)
    .required()
    .messages({
      'any.required': 'Customer ID is required',
      'any.invalid': 'Invalid customer ID format'
    })
});

// Update customer status validation schema
export const updateCustomerStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'banned')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either "active" or "banned"'
    })
});

// Upload image validation schema
export const uploadImageSchema = Joi.object({
  image: Joi.any()
    .required()
    .messages({
      'any.required': 'Image file is required'
    })
});
