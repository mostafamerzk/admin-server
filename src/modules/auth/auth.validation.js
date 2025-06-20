import Joi from 'joi';
import { isValidId } from '../../middlewares/vakidation.middleware.js';

/**
 * Authentication Validation Schemas
 * Based on the actual Users model from Prisma schema
 */

export const loginSchema = Joi.object({
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
    })
});

export const getUserSchema = Joi.object({
  id: Joi.string()
    .custom(isValidId)
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});
