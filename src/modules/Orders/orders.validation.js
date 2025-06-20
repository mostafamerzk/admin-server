import Joi from 'joi';

/**
 * Orders Validation Schemas
 * Based on the actual Order and OrderItem models from Prisma schema
 */

// Helper function to validate GUID format for IDs
const isValidGuid = (value, helpers) => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

// Helper function to validate integer ID format
const isValidIntId = (value, helpers) => {
  if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
    return helpers.error('any.invalid');
  }
  return Number(value);
};

// Order item schema for creating orders
const orderItemSchema = Joi.object({
  ProductId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Product ID must be a number',
      'number.integer': 'Product ID must be an integer',
      'number.positive': 'Product ID must be positive',
      'any.required': 'Product ID is required'
    }),
  
  Quantity: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 1000',
      'any.required': 'Quantity is required'
    })
});

// Create order validation schema
export const createOrderSchema = Joi.object({
  CustomerId: Joi.string()
    .custom(isValidGuid)
    .required()
    .messages({
      'any.required': 'Customer ID is required',
      'any.invalid': 'Invalid Customer ID format'
    }),
  
  SupplierId: Joi.string()
    .custom(isValidGuid)
    .required()
    .messages({
      'any.required': 'Supplier ID is required',
      'any.invalid': 'Invalid Supplier ID format'
    }),
  
  items: Joi.array()
    .items(orderItemSchema)
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'array.max': 'Cannot exceed 50 items per order',
      'any.required': 'Items array is required'
    }),
  
  DeliveryFees: Joi.number()
    .precision(2)
    .min(0)
    .max(999999.99)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Delivery fees must be a number',
      'number.min': 'Delivery fees cannot be negative',
      'number.max': 'Delivery fees cannot exceed 999,999.99'
    }),
  
  Discount: Joi.number()
    .precision(2)
    .min(0)
    .max(999999.99)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative',
      'number.max': 'Discount cannot exceed 999,999.99'
    }),
  
  Notes: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    }),
  
  PaymentMethod: Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'digital_wallet')
    .default('cash')
    .optional()
    .messages({
      'any.only': 'Payment method must be one of: cash, card, bank_transfer, digital_wallet'
    })
});

// Get orders list validation schema
export const getOrdersSchema = Joi.object({
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
  
  status: Joi.number()
    .integer()
    .valid(0, 1, 2, 3, 4) // pending, processing, shipped, delivered, cancelled
    .optional()
    .messages({
      'any.only': 'Status must be one of: 0 (pending), 1 (processing), 2 (shipped), 3 (delivered), 4 (cancelled)'
    }),
  
  customerId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .messages({
      'any.invalid': 'Invalid Customer ID format'
    }),
  
  supplierId: Joi.string()
    .custom(isValidGuid)
    .optional()
    .messages({
      'any.invalid': 'Invalid Supplier ID format'
    }),
  
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)'
    }),
  
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from'
    }),
  
  sort: Joi.string()
    .valid('CreatedDate', 'UpdatedDate', 'SubTotal', 'Status')
    .default('CreatedDate')
    .optional(),
  
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .optional()
});

// Get single order validation schema
export const getOrderSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Order ID must be a number',
      'number.integer': 'Order ID must be an integer',
      'number.positive': 'Order ID must be positive',
      'any.required': 'Order ID is required'
    })
});

// Update order status validation schema
export const updateOrderStatusSchema = Joi.object({
  status: Joi.number()
    .integer()
    .valid(0, 1, 2, 3, 4) // pending, processing, shipped, delivered, cancelled
    .required()
    .messages({
      'number.base': 'Status must be a number',
      'number.integer': 'Status must be an integer',
      'any.only': 'Status must be one of: 0 (pending), 1 (processing), 2 (shipped), 3 (delivered), 4 (cancelled)',
      'any.required': 'Status is required'
    }),
  
  Notes: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    })
});
