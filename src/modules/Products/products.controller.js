import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';
import {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  uploadProductImagesService,
  deleteProductImageService,
  deleteProductImageByUrlService
} from './products.service.js';

/**
 * Products Controller
 * All responses use exact field names from the Products Prisma model
 * Maps database fields to API response format
 */

/**
 * Map product data to response format
 */
const mapProductToResponse = (product) => {
  // Map images
  const images = product.Images?.map(img => img.Url) || [];
  const mainImage = images.length > 0 ? images[0] : null;

  // Map attributes
  const attributes = product.ProductAttribute?.map(attr => ({
    id: attr.ID,
    key: attr.Key,
    value: attr.Value
  })) || [];

  // Map variants
  const variants = product.ProductVariant?.map(variant => ({
    id: variant.ID,
    name: variant.Name,
    type: variant.Type,
    price: parseFloat(variant.CustomPrice),
    stock: variant.Stock
  })) || [];

  // Map category
  const category = product.Categories ? {
    id: product.Categories.ID,
    name: product.Categories.Name,
    description: product.Categories.Description
  } : null;

  // Map supplier
  const supplier = product.Suppliers ? {
    id: product.Suppliers.Id,
    name: product.Suppliers.Users?.Name,
    email: product.Suppliers.Users?.Email,
    phone: product.Suppliers.Users?.PhoneNumber
  } : null;

  // Map customer
  const customer = product.Customer ? {
    id: product.Customer.Id,
    name: product.Customer.Users?.Name,
    email: product.Customer.Users?.Email
  } : null;

  // Map reviews if available
  const reviews = product.Reviews?.map(review => ({
    id: review.ID,
    rating: review.Rate,
    comment: review.Body,
    customerName: review.Customer?.Users?.Name,
    createdAt: review.CreatedDate
  })) || [];

  return {
    id: product.ID,
    name: product.Name,
    description: product.Description,
    price: parseFloat(product.Price),
    stock: product.Stock,
    minimumStock: product.MinimumStock,
    sku: product.SKU,
    categoryId: product.CategoryId,
    supplierId: product.SupplierId,
    customerId: product.CustomerId,
    image: mainImage,
    images: images,
    category: category,
    supplier: supplier,
    customer: customer,
    attributes: attributes,
    variants: variants,
    reviews: reviews,
    createdAt: product.CreatedDate,
    updatedAt: product.UpdatedDate
  };
};

/**
 * @desc    Get all products with pagination, search, and filtering
 * @route   GET /api/products
 * @access  Private
 */
export const getProducts = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    search: req.query.search || '',
    category: req.query.category ? parseInt(req.query.category) : undefined,
    supplierId: req.query.supplierId || undefined,
    inStock: req.query.inStock !== undefined ? req.query.inStock === 'true' : undefined,
    sort: req.query.sort || 'CreatedDate',
    order: req.query.order || 'desc'
  };

  const result = await getProductsService(filters);
  
  // Map products to response format
  const products = result.products.map(mapProductToResponse);

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
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

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private
 */
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  const product = await getProductByIdService(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: mapProductToResponse(product)
  });
});

/**
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private
 */
export const createProduct = asyncHandler(async (req, res) => {
  try {
    const product = await createProductService(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: mapProductToResponse(product)
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Update existing product
 * @route   PUT /api/products/:id
 * @access  Private
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  try {
    const product = await updateProductService(productId, req.body);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: mapProductToResponse(product)
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  try {
    await deleteProductService(productId);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Upload product images
 * @route   POST /api/products/:id/images
 * @access  Private
 */
export const uploadProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }

  // Validate file count (max 10 files)
  if (req.files.length > 10) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 10 images allowed per upload'
    });
  }

  try {
    // Upload images to Cloudinary
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        // Create a unique public ID for each image
        const publicId = `product_${productId}_${Date.now()}_${index}`;

        // Upload to Cloudinary
        const result = await uploadToCloudinary(file.buffer, 'products', publicId);

        return {
          url: result.secure_url,
          publicId: result.public_id,
          originalName: file.originalname
        };
      } catch (uploadError) {
        console.error(`Error uploading file ${file.originalname}:`, uploadError);
        throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);

    // Extract URLs for database storage
    const imageUrls = uploadResults.map(result => result.url);

    // Save image URLs to database
    const uploadedUrls = await uploadProductImagesService(productId, imageUrls);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        imageUrls: uploadedUrls,
        uploadDetails: uploadResults.map(result => ({
          url: result.url,
          publicId: result.publicId,
          originalName: result.originalName
        }))
      }
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
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
 * @desc    Delete specific product image by URL
 * @route   DELETE /api/products/:productId/images
 * @access  Private
 */
export const deleteProductImage = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { imageUrl } = req.body;
  const productIdInt = parseInt(productId);

  try {
    // Delete image from database (soft delete) using URL
    const deletedImageInfo = await deleteProductImageByUrlService(productIdInt, imageUrl);

    // Extract public ID from Cloudinary URL for deletion
    let cloudinaryPublicId = null;
    try {
      // Extract public ID from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
      const urlParts = deletedImageInfo.imageUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
        // Get the part after version (v1234567890)
        const pathWithExtension = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension
        cloudinaryPublicId = pathWithExtension.replace(/\.[^/.]+$/, '');
      }
    } catch (urlParseError) {
      console.warn('Could not parse Cloudinary URL for deletion:', urlParseError.message);
    }

    // Attempt to delete from Cloudinary if we have a valid public ID
    let cloudinaryDeleted = false;
    if (cloudinaryPublicId) {
      try {
        const cloudinaryResult = await deleteFromCloudinary(cloudinaryPublicId);
        cloudinaryDeleted = cloudinaryResult.result === 'ok';
        console.log('Cloudinary deletion result:', cloudinaryResult);
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError.message);
        // Continue execution - database deletion was successful
      }
    }

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        imageId: deletedImageInfo.imageId,
        productId: deletedImageInfo.productId,
        imageUrl: deletedImageInfo.imageUrl,
        cloudinaryDeleted: cloudinaryDeleted,
        cloudinaryPublicId: cloudinaryPublicId
      }
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (error.message === 'Image not found or does not belong to this product') {
      return res.status(404).json({
        success: false,
        message: 'Image not found or does not belong to this product'
      });
    }
    throw error;
  }
});
