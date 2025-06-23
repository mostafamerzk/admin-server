import Joi from 'joi';

/**
 * Products Validation Schemas
 * Based on the actual Products model from Prisma schema
 */

// Custom validation functions
const isValidId = (value, helpers) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 450) {
    return helpers.error('any.invalid', { message: 'Invalid ID format' });
  }
  return value;
};

const isValidGuid = (value, helpers) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(value)) {
    return helpers.error('any.invalid', { message: 'Invalid GUID format' });
  }
  return value;
};

// Get products list validation schema
export const getProductsSchema = Joi.object({
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
  
  category: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Category must be a valid number',
      'number.integer': 'Category must be an integer',
      'number.min': 'Category ID must be greater than 0'
    }),
  
  supplierId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .messages({
      'any.invalid': 'Invalid supplier ID format'
    }),
  
  inStock: Joi.boolean()
    .optional(),
  
  sort: Joi.string()
    .valid('name', 'sku', 'price', 'stock', 'createdAt', 'updatedAt')
    .default('createdAt')
    .optional(),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

// Get single product validation schema
export const getProductSchema = Joi.object({
  id: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': 'Product ID is required',
      'number.base': 'Product ID must be a number',
      'number.integer': 'Product ID must be an integer',
      'number.min': 'Product ID must be greater than 0'
    })
});

// Create product validation schema
export const createProductSchema = Joi.object({
  Name: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 255 characters'
    }),
  
  Description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  Price: Joi.number()
    .precision(2)
    .min(0)
    .required()
    .messages({
      'any.required': 'Price is required',
      'number.base': 'Price must be a valid number',
      'number.min': 'Price must be greater than or equal to 0'
    }),
  
  Stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Stock must be a valid number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock must be greater than or equal to 0'
    }),
  
  MinimumStock: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Minimum stock must be a valid number',
      'number.integer': 'Minimum stock must be an integer',
      'number.min': 'Minimum stock must be greater than or equal to 0'
    }),
  
  CategoryId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': 'Category ID is required',
      'number.base': 'Category ID must be a valid number',
      'number.integer': 'Category ID must be an integer',
      'number.min': 'Category ID must be greater than 0'
    }),
  
  SupplierId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .allow('')
    .messages({
      'any.invalid': 'Invalid supplier ID format'
    }),
  
  CustomerId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .allow('')
    .messages({
      'any.invalid': 'Invalid customer ID format'
    }),
  
  // Product attributes (optional array)
  Attributes: Joi.array()
    .items(
      Joi.object({
        Key: Joi.string()
          .min(1)
          .max(255)
          .required()
          .messages({
            'any.required': 'Attribute key is required',
            'string.min': 'Attribute key must be at least 1 character long',
            'string.max': 'Attribute key must not exceed 255 characters'
          }),
        Value: Joi.string()
          .min(1)
          .max(255)
          .required()
          .messages({
            'any.required': 'Attribute value is required',
            'string.min': 'Attribute value must be at least 1 character long',
            'string.max': 'Attribute value must not exceed 255 characters'
          })
      })
    )
    .optional(),
  
  // Product variants (optional array)
  Variants: Joi.array()
    .items(
      Joi.object({
        Name: Joi.string()
          .min(1)
          .max(255)
          .optional()
          .allow('')
          .messages({
            'string.min': 'Variant name must be at least 1 character long',
            'string.max': 'Variant name must not exceed 255 characters'
          }),
        Type: Joi.string()
          .min(1)
          .max(255)
          .optional()
          .allow('')
          .messages({
            'string.min': 'Variant type must be at least 1 character long',
            'string.max': 'Variant type must not exceed 255 characters'
          }),
        CustomPrice: Joi.number()
          .precision(2)
          .min(0)
          .required()
          .messages({
            'any.required': 'Variant price is required',
            'number.base': 'Variant price must be a valid number',
            'number.min': 'Variant price must be greater than or equal to 0'
          }),
        Stock: Joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'any.required': 'Variant stock is required',
            'number.base': 'Variant stock must be a valid number',
            'number.integer': 'Variant stock must be an integer',
            'number.min': 'Variant stock must be greater than or equal to 0'
          })
      })
    )
    .optional()
});

// Update product validation schema (all fields optional except ID)
export const updateProductSchema = Joi.object({
  Name: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.min': 'Product name must be at least 1 character long',
      'string.max': 'Product name must not exceed 255 characters'
    }),
  
  Description: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
  
  Price: Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': 'Price must be a valid number',
      'number.min': 'Price must be greater than or equal to 0'
    }),
  
  Stock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Stock must be a valid number',
      'number.integer': 'Stock must be an integer',
      'number.min': 'Stock must be greater than or equal to 0'
    }),
  
  MinimumStock: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Minimum stock must be a valid number',
      'number.integer': 'Minimum stock must be an integer',
      'number.min': 'Minimum stock must be greater than or equal to 0'
    }),
  
  CategoryId: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Category ID must be a valid number',
      'number.integer': 'Category ID must be an integer',
      'number.min': 'Category ID must be greater than 0'
    }),
  
  SupplierId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .allow('')
    .messages({
      'any.invalid': 'Invalid supplier ID format'
    }),
  
  CustomerId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .allow('')
    .messages({
      'any.invalid': 'Invalid customer ID format'
    }),

  // Product attributes (optional array for updates)
  Attributes: Joi.array()
    .items(
      Joi.object({
        ID: Joi.number()
          .integer()
          .min(1)
          .optional()
          .messages({
            'number.base': 'Attribute ID must be a valid number',
            'number.integer': 'Attribute ID must be an integer',
            'number.min': 'Attribute ID must be greater than 0'
          }),
        Key: Joi.string()
          .min(1)
          .max(255)
          .required()
          .messages({
            'any.required': 'Attribute key is required',
            'string.min': 'Attribute key must be at least 1 character long',
            'string.max': 'Attribute key must not exceed 255 characters'
          }),
        Value: Joi.string()
          .min(1)
          .max(255)
          .required()
          .messages({
            'any.required': 'Attribute value is required',
            'string.min': 'Attribute value must be at least 1 character long',
            'string.max': 'Attribute value must not exceed 255 characters'
          }),
        _action: Joi.string()
          .valid('create', 'update', 'delete')
          .optional()
          .messages({
            'any.only': 'Action must be one of: create, update, delete'
          })
      })
    )
    .optional(),

  // Product variants (optional array for updates)
  Variants: Joi.array()
    .items(
      Joi.object({
        ID: Joi.number()
          .integer()
          .min(1)
          .optional()
          .messages({
            'number.base': 'Variant ID must be a valid number',
            'number.integer': 'Variant ID must be an integer',
            'number.min': 'Variant ID must be greater than 0'
          }),
        Name: Joi.string()
          .min(1)
          .max(255)
          .optional()
          .allow('')
          .messages({
            'string.min': 'Variant name must be at least 1 character long',
            'string.max': 'Variant name must not exceed 255 characters'
          }),
        Type: Joi.string()
          .min(1)
          .max(255)
          .optional()
          .allow('')
          .messages({
            'string.min': 'Variant type must be at least 1 character long',
            'string.max': 'Variant type must not exceed 255 characters'
          }),
        CustomPrice: Joi.number()
          .precision(2)
          .min(0)
          .required()
          .messages({
            'any.required': 'Variant price is required',
            'number.base': 'Variant price must be a valid number',
            'number.min': 'Variant price must be greater than or equal to 0'
          }),
        Stock: Joi.number()
          .integer()
          .min(0)
          .required()
          .messages({
            'any.required': 'Variant stock is required',
            'number.base': 'Variant stock must be a valid number',
            'number.integer': 'Variant stock must be an integer',
            'number.min': 'Variant stock must be greater than or equal to 0'
          }),
        _action: Joi.string()
          .valid('create', 'update', 'delete')
          .optional()
          .messages({
            'any.only': 'Action must be one of: create, update, delete'
          })
      })
    )
    .optional()
});

// Delete image validation schema
export const deleteImageSchema = Joi.object({
  productId: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'any.required': 'Product ID is required',
      'number.base': 'Product ID must be a number',
      'number.integer': 'Product ID must be an integer',
      'number.min': 'Product ID must be greater than 0'
    })
});

// Delete image by URL validation schema (for request body)
export const deleteImageByUrlSchema = Joi.object({
  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'any.required': 'Image URL is required',
      'string.uri': 'Image URL must be a valid URL'
    })
});

// Update product status validation schema
export const updateProductStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either "active" or "inactive"'
    })
});