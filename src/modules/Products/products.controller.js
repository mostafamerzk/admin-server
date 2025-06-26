import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';
import {
  getProductsService,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  updateProductStatusService,
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
 * Map product data to response format matching frontend expectations
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

  // Determine product status based on stock and deleted flag
  let status = 'active';
  if (product.Deleted) {
    status = 'inactive';
  } else if (!product.Stock || product.Stock <= 0) {
    status = 'out_of_stock';
  }

  return {
    id: product.ID,
    name: product.Name || '',
    sku: product.SKU || '',
    price: parseFloat(product.Price) || 0,
    stock: product.Stock || 0,
    minimumStock: product.MinimumStock || 0,
    status,
    description: product.Description || null,
    image: mainImage,
    images: images,
    categoryId: product.CategoryId,
    category: category,
    supplierId: product.SupplierId || null,
    supplier: supplier,
    customerId: product.CustomerId || null,
    attributes: attributes,
    variants: variants,
    createdAt: product.CreatedDate.toISOString(),
    updatedAt: product.UpdatedDate?.toISOString() || product.CreatedDate.toISOString()
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
    // deleted: req.query.deleted !== undefined ? req.query.deleted === 'true' : undefined,
    sort: req.query.sort || 'createdAt',
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
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.totalPages,
      hasNext: result.pagination.hasNext,
      hasPrev: result.pagination.hasPrev
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
 * @desc    Create new product with optional image uploads
 * @route   POST /api/products
 * @access  Private
 */
export const createProduct = asyncHandler(async (req, res) => {
  try {
    // Extract image files from multer (if any)
    const imageFiles = req.files || null;

    // Create product with image files
    const product = await createProductService(req.body, imageFiles);

    // Prepare response data
    const responseData = {
      ...mapProductToResponse(product),
      ...(imageFiles && imageFiles.length > 0 && {
        imageUpload: {
          uploadedCount: imageFiles.length,
          images: imageFiles.map(file => ({
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          }))
        }
      })
    };

    res.status(201).json({
      success: true,
      message: imageFiles && imageFiles.length > 0
        ? `Product created successfully with ${imageFiles.length} image(s)`
        : 'Product created successfully',
      data: responseData
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
 * @desc    Update existing product with optional image operations
 * @route   PUT /api/products/:id
 * @access  Private
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productId = parseInt(id);

  try {
    // Extract image files from multer (if any)
    const imageFiles = req.files || null;

    // Extract images to delete from request body
    const imagesToDelete = req.body.imagesToDelete ?
      (Array.isArray(req.body.imagesToDelete) ? req.body.imagesToDelete : [req.body.imagesToDelete]) :
      null;

    // Remove imagesToDelete from body to avoid passing it to the service as a product field
    const { imagesToDelete: _, ...updateData } = req.body;

    // Update product with image operations
    const product = await updateProductService(productId, updateData, imageFiles, imagesToDelete);

    // Prepare response data
    const responseData = {
      ...mapProductToResponse(product),
      ...(imageFiles && imageFiles.length > 0 && {
        imageUpload: {
          uploadedCount: imageFiles.length,
          images: imageFiles.map(file => ({
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype
          }))
        }
      }),
      ...(imagesToDelete && imagesToDelete.length > 0 && {
        imagesDeletion: {
          deletedCount: imagesToDelete.length,
          deletedUrls: imagesToDelete
        }
      })
    };

    res.status(200).json({
      success: true,
      message: (() => {
        const parts = ['Product updated successfully'];
        if (imageFiles && imageFiles.length > 0) {
          parts.push(`with ${imageFiles.length} new image(s)`);
        }
        if (imagesToDelete && imagesToDelete.length > 0) {
          parts.push(`and ${imagesToDelete.length} image(s) deleted`);
        }
        return parts.join(' ');
      })(),
      data: responseData
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

/**
 * @desc    Update product status (active/inactive)
 * @route   PUT /api/products/:id/status
 * @access  Private
 */
export const updateProductStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const productId = parseInt(id);

  try {
    const product = await updateProductStatusService(productId, status);

    res.status(200).json({
      success: true,
      message: `Product status updated to ${status} successfully`,
      data: mapProductToResponse(product)
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    if (error.message.includes('already in this status')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});
