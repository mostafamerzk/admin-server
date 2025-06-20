import Joi from 'joi';

/**
 * Suppliers Validation Schemas
 * Based on the actual Users and Suppliers models from Prisma schema
 */

// Custom GUID validation function
const isValidGuid = (value, helpers) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(value)) {
    return helpers.error('any.invalid', { message: 'Invalid GUID format' });
  }
  return value;
};

// Get suppliers list validation schema
export const getSuppliersSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional(),
  
  search: Joi.string()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search term must not exceed 255 characters'
    }),
  
  verificationStatus: Joi.string()
    .valid('verified', 'pending')
    .optional(),
  
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

// Get single supplier validation schema
export const getSupplierSchema = Joi.object({
  id: Joi.string()
    .custom(isValidGuid)
    .required()
    .messages({
      'any.required': 'Supplier ID is required',
      'any.invalid': 'Invalid supplier ID format'
    })
});

// Get supplier products validation schema
export const getSupplierProductsSchema = Joi.object({
  id: Joi.string()
    .custom(isValidGuid)
    .required()
    .messages({
      'any.required': 'Supplier ID is required',
      'any.invalid': 'Invalid supplier ID format'
    })
}).concat(Joi.object({
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
    .optional()
}));

// Create supplier validation schema
export const createSupplierSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Business name must be at least 2 characters long',
      'string.max': 'Business name must not exceed 255 characters'
    }),
  
  email: Joi.string()
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
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address must not exceed 500 characters'
    }),
  
  contactPerson: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Contact person name must be at least 2 characters long',
      'string.max': 'Contact person name must not exceed 255 characters',
      'any.required': 'Contact person is required'
    }),
  
  categories: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category must not exceed 100 characters'
    }),
  
  image: Joi.string()
    .optional()
    .allow('')
    .messages({
      'string.base': 'Image must be a valid base64 string'
    })
});

// Update supplier verification status validation schema
export const updateVerificationStatusSchema = Joi.object({
  verificationStatus: Joi.string()
    .valid('verified', 'pending')
    .required()
    .messages({
      'any.required': 'Verification status is required',
      'any.only': 'Verification status must be either "verified" or "pending"'
    })
});

// Ban supplier validation schema
export const banSupplierSchema = Joi.object({
  status: Joi.string()
    .valid('banned')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be "banned"'
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
