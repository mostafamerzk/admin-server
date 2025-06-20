import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import {
  getCustomersService,
  getCustomerByIdService,
  createCustomerService,
  updateCustomerService,
  deleteCustomerService,
  updateCustomerStatusService
} from './customers.service.js';

/**
 * Customer Controller
 * All responses use exact field names from the Users Prisma model
 * Maps database fields to API response format
 */

/**
 * Map database user to API response format
 */
const mapUserToResponse = (user) => {
  if (!user) return null;

  // Determine user type and status
  const userType = user.Customer ? 'customer' : 'user';
  const status = user.LockoutEnabled ? 'banned' : 'active';
  
  // Map verification status
  let verificationStatus = 'pending';
  if (user.EmailConfirmed) {
    verificationStatus = 'verified';
  } else if (user.LockoutEnabled) {
    verificationStatus = 'rejected';
  }

  return {
    id: user.Id,
    name: user.Name,
    email: user.Email,
    type: userType,
    status: status,
    avatar: user.ImageUrl,
    phone: user.PhoneNumber,
    address: user.Address,
    businessType: user.BusinessType,
    verificationStatus: verificationStatus,

  };
};

/**
 * @desc    Get all customers with pagination, search, and filtering
 * @route   GET /api/users
 * @access  Private
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search || '',
    status: req.query.status,
    sort: req.query.sort || 'updatedAt',
    order: req.query.order || 'desc'
  };

  const result = await getCustomersService(filters);
  
  // Map customers to response format
  const customers = result.customers.map(mapUserToResponse);

  res.status(200).json({
    success: true,
    message: 'Customers retrieved successfully',
    data: customers,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single customer by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const customer = await getCustomerByIdService(id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Customer retrieved successfully',
    data: mapUserToResponse(customer)
  });
});

/**
 * @desc    Create new customer
 * @route   POST /api/users
 * @access  Private
 */
export const createCustomer = asyncHandler(async (req, res) => {
  try {
    const customer = await createCustomerService(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: mapUserToResponse(customer)
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
 * @desc    Update customer
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const customer = await updateCustomerService(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: mapUserToResponse(customer)
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
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
 * @desc    Delete customer
 * @route   DELETE /api/users/:id
 * @access  Private
 */
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await deleteCustomerService(id);

    res.status(204).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
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
 * @desc    Update customer status (active/banned)
 * @route   PUT /api/users/:id/status
 * @access  Private
 */
export const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const customer = await updateCustomerStatusService(id, status);

    res.status(200).json({
      success: true,
      message: 'Customer status updated successfully',
      data: mapUserToResponse(customer)
    });
  } catch (error) {
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
 * @desc    Upload customer image
 * @route   POST /api/users/upload-image
 * @access  Private
 */
export const uploadCustomerImage = asyncHandler(async (req, res) => {
  // This will be handled by multer middleware
  // The file will be available in req.file
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  // For now, return a mock URL - in production this would upload to cloud storage
  const imageUrl = `https://example.com/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      imageUrl: imageUrl
    }
  });
});
