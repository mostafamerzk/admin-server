import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import {
  getSuppliersService,
  getSupplierByIdService,
  getSupplierProductsService,
  createSupplierService,
  updateSupplierVerificationStatusService,
  banSupplierService,
  unbanSupplierService,
  deleteSupplierService
} from './suppliers.service.js';

/**
 * Suppliers Controller
 * All responses use exact field names from the Users and Suppliers Prisma models
 * Maps database fields to API response format
 */

/**
 * Map supplier (user) data to response format
 */
const mapSupplierToResponse = (supplier) => {
  return {
    id: supplier.Id,
    name: supplier.Name,
    email: supplier.Email,
    phone: supplier.PhoneNumber,
    address: supplier.Address,
    status: supplier.LockoutEnabled ? 'banned' : 'active',
    verificationStatus: supplier.EmailConfirmed ? 'verified' : 'pending',
    categories: supplier.BusinessType || null, // Use BusinessType from Users table
    contactPerson: supplier.Name, // Same as name
    logo: supplier.ImageUrl
  };
};

/**
 * Map product data to response format
 */
const mapProductToResponse = (product) => {
  // Map images
  const images = product.Images?.map(img => img.Url) || [];
  const mainImage = images.length > 0 ? images[0] : null;

  // Map attributes (simplified)
  const attributes = product.ProductAttribute?.map(attr => ({
    id: attr.ID,
    name: attr.Key,
    value: attr.Value
  })) || [];

  // Map variants (simplified)
  const variants = product.ProductVariant?.map(variant => ({
    id: variant.ID,
    name: variant.Name,
    price: parseFloat(variant.CustomPrice),
    stock: variant.Stock
  })) || [];

  return {
    id: product.ID,
    name: product.Name,
    sku: product.SKU,
    category: product.Categories?.Name || null,
    price: parseFloat(product.Price),
    stock: product.Stock,
    minimumStock: product.MinimumStock,
    status: product.Deleted ? 'inactive' : 'active',
    description: product.Description,
    image: mainImage,
    images: images,
    attributes: attributes,
    variants: variants,
    createdAt: product.CreatedDate,
    updatedAt: product.UpdatedDate
  };
};

/**
 * @desc    Get all suppliers with pagination, search, and filtering
 * @route   GET /api/suppliers
 * @access  Private
 */
export const getSuppliers = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    search: req.query.search || '',
    verificationStatus: req.query.verificationStatus,
    status: req.query.status,
    sort: req.query.sort || 'updatedAt',
    order: req.query.order || 'desc'
  };

  const result = await getSuppliersService(filters);
  
  // Map suppliers to response format
  const suppliers = result.suppliers.map(mapSupplierToResponse);

  res.status(200).json({
    success: true,
    message: 'Suppliers retrieved successfully',
    data: {
      suppliers: suppliers,
      pagination: {
        currentPage: result.pagination.page,
        totalPages: result.pagination.pages,
        totalItems: result.pagination.total,
        itemsPerPage: result.pagination.limit,
        hasNextPage: result.pagination.page < result.pagination.pages,
        hasPreviousPage: result.pagination.page > 1
      }
    }
  });
});

/**
 * @desc    Get single supplier by ID
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
export const getSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const supplier = await getSupplierByIdService(id);

  if (!supplier) {
    return res.status(404).json({
      success: false,
      message: 'Supplier not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Supplier retrieved successfully',
    data: mapSupplierToResponse(supplier)
  });
});

/**
 * @desc    Get supplier products
 * @route   GET /api/suppliers/:id/products
 * @access  Private
 */
export const getSupplierProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10
  };

  try {
    const result = await getSupplierProductsService(id, filters);
    
    // Map products to response format
    const products = result.products.map(mapProductToResponse);

    res.status(200).json({
      success: true,
      message: 'Supplier products retrieved successfully',
      data: {
        products: products,
        pagination: {
          currentPage: result.pagination.page,
          totalPages: result.pagination.pages,
          totalItems: result.pagination.total,
          itemsPerPage: result.pagination.limit,
          hasNextPage: result.pagination.page < result.pagination.pages,
          hasPreviousPage: result.pagination.page > 1
        }
      }
    });
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Create new supplier
 * @route   POST /api/suppliers
 * @access  Private
 */
export const createSupplier = asyncHandler(async (req, res) => {
  try {
    const supplier = await createSupplierService(req.body);

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: mapSupplierToResponse(supplier)
    });
  } catch (error) {
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    throw error;
  }
});

/**
 * @desc    Update supplier verification status
 * @route   PUT /api/suppliers/:id/verification-status
 * @access  Private
 */
export const updateSupplierVerificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { verificationStatus } = req.body;

  try {
    const supplier = await updateSupplierVerificationStatusService(id, verificationStatus);

    res.status(200).json({
      success: true,
      message: 'Supplier verification status updated successfully',
      data: {
        id: supplier.Id,
        name: supplier.Name,
        verificationStatus: supplier.EmailConfirmed ? 'verified' : 'pending',
        status: supplier.LockoutEnabled ? 'banned' : 'active'
      }
    });
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Ban supplier
 * @route   PUT /api/suppliers/:id/ban
 * @access  Private
 */
export const banSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const supplier = await banSupplierService(id);

    res.status(200).json({
      success: true,
      message: 'Supplier banned successfully',
      data: {
        id: supplier.Id,
        name: supplier.Name,
        status: 'banned'
      }
    });
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Unban supplier
 * @route   PUT /api/suppliers/:id/unban
 * @access  Private
 */
export const unbanSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const supplier = await unbanSupplierService(id);

    res.status(200).json({
      success: true,
      message: 'Supplier unbanned successfully',
      data: {
        id: supplier.Id,
        name: supplier.Name,
        status: 'active'
      }
    });
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete supplier
 * @route   DELETE /api/suppliers/:id
 * @access  Private
 */
export const deleteSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteSupplierService(id);

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
      data: {
        id: id,
        status: 'deleted',
        relatedDataHandled: result.deletedData
      }
    });
  } catch (error) {
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Handle foreign key constraint errors
    if (error.code === 'P2003' || error.message.includes('Foreign key constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete supplier due to existing relationships. Please contact support.'
      });
    }

    // Handle transaction errors
    if (error.message.includes('Transaction')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete supplier due to database transaction error. Please try again.'
      });
    }

    throw error;
  }
});
