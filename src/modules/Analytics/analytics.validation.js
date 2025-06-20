import Joi from 'joi';

/**
 * Validation schemas for Analytics endpoints
 */

// Validation for period query parameter
export const periodSchema = Joi.object({
  period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month')
});
