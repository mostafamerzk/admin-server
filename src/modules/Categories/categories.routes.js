import { Router } from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  // banCategory,
  // unbanCategory,
  updateCategoryStatus,
  // getCategoryProducts,
  // uploadCategoryImage,
  // deleteCategoryImage
} from './categories.controller.js';
import { validation } from '../../middlewares/vakidation.middleware.js';
import { isAuthenticated } from '../../middlewares/auth.middleware.js';
import { uploadCloudFile } from '../../utils/multer/cloud.multer.js';
import { handleMulterError } from '../../middlewares/multer-error.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  getCategorySchema,
  updateCategoryStatusSchema,
  // getCategoryProductsSchema
} from './categories.validation.js';

const router = Router();

/**
 * Categories Management Routes
 * Base path: /api/categories
 * All routes require authentication
 */

// @route   GET /api/categories
// @desc    Get all categories with pagination, search, and filtering
// @access  Private
router.get(
  '/',
  isAuthenticated,
  validation(getCategoriesSchema, 'query'),
  getCategories
);

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Private
router.get(
  '/:id',
  isAuthenticated,
  validation(getCategorySchema, 'params'),
  getCategory
);

// @route   POST /api/categories
// @desc    Create new category with optional image upload
// @access  Private
router.post(
  '/',
  isAuthenticated,
  uploadCloudFile(['jpg', 'jpeg', 'png', 'gif', 'webp']).single('image'),
  handleMulterError,
  validation(createCategorySchema),
  createCategory
);

// @route   PUT /api/categories/:id
// @desc    Update category with optional image upload
// @access  Private
router.put(
  '/:id',
  isAuthenticated,
  uploadCloudFile(['jpg', 'jpeg', 'png', 'gif', 'webp']).single('image'),
  handleMulterError,
  validation(getCategorySchema, 'params'),
  validation(updateCategorySchema),
  updateCategory
);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete(
  '/:id',
  isAuthenticated,
  validation(getCategorySchema, 'params'),
  deleteCategory
);

// // @route   PUT /api/categories/:id/ban
// // @desc    Ban category and all its products
// // @access  Private
// router.put(
//   '/:id/ban',
//   isAuthenticated,
//   validation(getCategorySchema, 'params'),
//   banCategory
// );

// // @route   PUT /api/categories/:id/unban
// // @desc    Unban category and all its products
// // @access  Private
// router.put(
//   '/:id/unban',
//   isAuthenticated,
//   validation(getCategorySchema, 'params'),
//   unbanCategory
// );

// @route   PUT /api/categories/:id/status
// @desc    Update category status
// @access  Private
router.put(
  '/:id/status',
  isAuthenticated,
  validation(getCategorySchema, 'params'),
  validation(updateCategoryStatusSchema),
  updateCategoryStatus
);

// // @route   GET /api/categories/:id/products
// // @desc    Get category products
// // @access  Private
// router.get(
//   '/:id/products',
//   isAuthenticated,
//   validation(getCategoryProductsSchema, 'params'),
//   validation(getCategoriesSchema, 'query'), // Reuse pagination validation
//   getCategoryProducts
// );

// @route   POST /api/categories/:id/upload-image
// @desc    Upload category image
// @access  Private
// router.post(
//   '/:id/upload-image',
//   isAuthenticated,
//   validation(getCategorySchema, 'params'),
//   uploadCloudFile(['jpg', 'jpeg', 'png', 'gif', 'webp']).single('image'),
//   handleMulterError,
//   uploadCategoryImage
// );

// @route   DELETE /api/categories/:id/image
// @desc    Delete category image
// @access  Private
// router.delete(
//   '/:id/image',
//   isAuthenticated,
//   validation(getCategorySchema, 'params'),
//   deleteCategoryImage
// );

export default router;
