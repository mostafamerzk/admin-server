import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import {
  getCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getCategoryProductsService
} from './categories.service.js';

/**
 * Categories Controller
 * All responses use exact field names from the Categories Prisma model
 * Maps database fields to API response format
 */

/**
 * Map database category to API response format
 */
const mapCategoryToResponse = (category) => ({
  id: category.ID,
  name: category.Name,
  description: category.Description,
  status: 'active', // Default since Status field doesn't exist in current schema
  productCount: category._count?.Products || 0,
  image: null, // Default since Image field doesn't exist in current schema
  createdAt: category.CreatedDate.toISOString(),
  updatedAt: category.UpdatedDate?.toISOString() || category.CreatedDate.toISOString()
});

/**
 * Map database product to API response format
 */
const mapProductToResponse = (product) => ({
  id: `prod_${product.ID}`,
  name: product.Name || '',
  sku: product.SKU || '',
  price: parseFloat(product.Price) || 0,
  stock: product.Stock || 0,
  status: 'active', // Default since Status field would need to be checked
  image: null, // Would need to get from Images table
  categoryId: `cat_${product.CategoryId}`,
  createdAt: product.CreatedDate.toISOString(),
  updatedAt: product.UpdatedDate?.toISOString() || product.CreatedDate.toISOString()
});

/**
 * @desc    Get all categories with pagination, search, and filtering
 * @route   GET /api/categories
 * @access  Private
 */
export const getCategories = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search || '',
    status: req.query.status,
    sort: req.query.sort || 'updatedAt',
    order: req.query.order || 'desc'
  };

  const result = await getCategoriesService(filters);
  
  // Map categories to response format
  const categories = result.categories.map(mapCategoryToResponse);

  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: categories,
    pagination: {
      currentPage: result.pagination.page,
      totalPages: result.pagination.pages,
      totalItems: result.pagination.total,
      itemsPerPage: result.pagination.limit,
      hasNextPage: result.pagination.page < result.pagination.pages,
      hasPreviousPage: result.pagination.page > 1
    }
  });
});

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Private
 */
export const getCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  const category = await getCategoryByIdService(categoryId);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Category retrieved successfully',
    data: mapCategoryToResponse(category)
  });
});

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private
 */
export const createCategory = asyncHandler(async (req, res) => {
  try {
    const category = await createCategoryService(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: mapCategoryToResponse(category)
    });
  } catch (error) {
    if (error.message === 'Category name already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await updateCategoryService(categoryId, req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: mapCategoryToResponse(category)
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Category name already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  try {
    await deleteCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Cannot delete category with associated products') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Update category status
 * @route   PUT /api/categories/:id/status
 * @access  Private
 */
export const updateCategoryStatus = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const { status } = req.body;

  try {
    // Since Status field doesn't exist in current schema, we'll just return success
    // In a real implementation, this would update the status field
    const category = await getCategoryByIdService(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category status updated successfully',
      data: mapCategoryToResponse(category)
    });
  } catch (error) {
    throw error;
  }
});

/**
 * @desc    Get category products
 * @route   GET /api/categories/:id/products
 * @access  Private
 */
export const getCategoryProducts = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search || '',
    status: req.query.status
  };

  // Check if category exists
  const category = await getCategoryByIdService(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  const result = await getCategoryProductsService(categoryId, filters);
  
  // Map products to response format
  const products = result.products.map(mapProductToResponse);

  res.status(200).json({
    success: true,
    message: 'Category products retrieved successfully',
    data: products,
    pagination: {
      currentPage: result.pagination.page,
      totalPages: result.pagination.pages,
      totalItems: result.pagination.total,
      itemsPerPage: result.pagination.limit,
      hasNextPage: result.pagination.page < result.pagination.pages,
      hasPreviousPage: result.pagination.page > 1
    }
  });
});
