import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';
import {
  getCategoriesService,
  getCategoryByIdService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  banCategoryService,
  unbanCategoryService,
  updateCategoryStatusService,
  getCategoryProductsService,
  uploadCategoryImageService,
  deleteCategoryImageService
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
  status: category.Deleted ? 'inactive' : 'active', 
  productCount: category._count?.Products || 0,
  image: category.imageUrl || null,
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
  status: product.Deleted ? 'inactive' : 'active',
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
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.pages,
      hasNext: result.pagination.page < result.pagination.pages,
      hasPrev: result.pagination.page > 1
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
 * @desc    Create new category with optional image upload
 * @route   POST /api/categories
 * @access  Private
 */
export const createCategory = asyncHandler(async (req, res) => {
  try {
    // Extract image file from request if present
    const imageFile = req.file || null;
    const { imageUrl } = req.body;

    // Validate that either image file or imageUrl is provided
    if (!imageFile && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Either image file or imageUrl is required'
      });
    }

    // Create category with image file
    const category = await createCategoryService(req.body, imageFile);

    // Prepare response data
    const responseData = {
      ...mapCategoryToResponse(category),
      ...(imageFile && {
        imageUpload: {
          originalName: imageFile.originalname,
          size: imageFile.size,
          mimeType: imageFile.mimetype
        }
      })
    };

    res.status(201).json({
      success: true,
      message: imageFile
        ? 'Category created successfully with image'
        : 'Category created successfully',
      data: responseData
    });
  } catch (error) {
    if (error.message === 'Category name already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Failed to upload image')) {
      return res.status(400).json({
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
 * @desc    Ban category and all its products
 * @route   PUT /api/categories/:id/ban
 * @access  Private
 */
export const banCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  try {
    const result = await banCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: 'Category and its products banned successfully',
      data: {
        category: mapCategoryToResponse(result.category),
        bannedProductsCount: result.bannedProductsCount
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Category is already banned') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Unban category and all its products
 * @route   PUT /api/categories/:id/unban
 * @access  Private
 */
export const unbanCategory = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;

  try {
    const result = await unbanCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: 'Category and its products unbanned successfully',
      data: {
        category: mapCategoryToResponse(result.category),
        unbannedProductsCount: result.unbannedProductsCount
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message === 'Category is already active') {
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
    // Validate status parameter
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "inactive"'
      });
    }

    // Update category status and cascade to products
    const result = await updateCategoryStatusService(categoryId, status);

    res.status(200).json({
      success: true,
      message: `Category status updated to ${status} successfully. ${result.updatedProductsCount} products were also updated.`,
      data: {
        category: mapCategoryToResponse(result.category),
        updatedProductsCount: result.updatedProductsCount
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (error.message.includes('already')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

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
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.pages,
      hasNext: result.pagination.page < result.pagination.pages,
      hasPrev: result.pagination.page > 1
    }
  });
});

/**
 * @desc    Upload category image
 * @route   POST /api/categories/:id/image
 * @access  Private
 */
export const uploadCategoryImage = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const categoryIdInt = parseInt(categoryId);

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  try {
    // Upload image to Cloudinary
    const publicId = `category_${categoryIdInt}_${Date.now()}`;
    const result = await uploadToCloudinary(req.file.buffer, 'categories', publicId);

    // Save image URL to database
    const updatedCategory = await uploadCategoryImageService(categoryIdInt, result.secure_url);

    res.status(200).json({
      success: true,
      message: 'Category image uploaded successfully',
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        category: mapCategoryToResponse(updatedCategory)
      }
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Handle upload errors
    if (error.message.includes('Failed to upload')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});

/**
 * @desc    Delete category image
 * @route   DELETE /api/categories/:id/image
 * @access  Private
 */
export const deleteCategoryImage = asyncHandler(async (req, res) => {
  const categoryId = req.params.id;
  const categoryIdInt = parseInt(categoryId);

  try {
    // Delete image from database and Cloudinary
    const updatedCategory = await deleteCategoryImageService(categoryIdInt);

    res.status(200).json({
      success: true,
      message: 'Category image deleted successfully',
      data: mapCategoryToResponse(updatedCategory)
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (error.message === 'Category has no image to delete') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    throw error;
  }
});
