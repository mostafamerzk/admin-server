import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import {
  getOrdersService,
  getOrderByIdService,
  createOrderService,
  updateOrderService,
  deleteOrderService,
  updateOrderStatusService,
  approveOrderService,
  rejectOrderService,
  completeOrderService
} from './orders.service.js';

/**
 * Orders Controller
 * Updated to match the new API requirements with proper data mapping
 * Maps database fields to frontend-expected API response format
 */

/**
 * Map order status number to readable string
 */
const getStatusString = (status) => {
  const statusMap = {
    0: 'pending',
    1: 'approved',
    2: 'rejected',
    3: 'completed'
  };
  return statusMap[status] || 'pending';
};

/**
 * Map database order to API response format
 * Updated to match frontend expected structure
 */
const mapOrderToResponse = (order) => {
  if (!order) return null;

  // Calculate total amount
  const totalAmount = parseFloat(order.SubTotal) + parseFloat(order.DeliveryFees) - parseFloat(order.Discount);

  return {
    id: order.ID,
    customerName: order.Customer?.Users?.Name || '',
    supplierName: order.Suppliers?.Users?.Name || '',
    totalAmount: totalAmount,
    status: getStatusString(order.Status),
    orderDate: order.CreatedDate?.toISOString() || '',
    customerId: order.CustomerId,
    supplierId: order.SupplierId,
    orderNumber: order.OrderNumber,
    paymentMethod: order.PaymentMethod || '',
    createdAt: order.CreatedDate?.toISOString() || '',
    updatedAt: order.UpdatedDate?.toISOString() || null,
    notes: order.Notes || '',
    shippingAddress: {
      address: order.Customer?.Users?.Address || ''
    },
    billingAddress: {
      address: order.Customer?.Users?.Address || 'Same as shipping address'
    },
    items: order.OrderItem ? order.OrderItem.map(item => ({
      id: item.ID,
      name: item.Products?.Name || '',
      quantity: item.Quantity,
      unitPrice: parseFloat(item.Products?.Price || 0),
      description: item.Products?.Description || '',
      sku: item.Products?.SKU || ''
    })) : []
  };
};

/**
 * @desc    Get all orders with pagination, search, and filtering
 * @route   GET /api/orders
 * @access  Private
 */
export const getOrders = asyncHandler(async (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
    search: req.query.search || '',
    status: req.query.status !== undefined ? parseInt(req.query.status) : undefined,
    customerId: req.query.customerId || undefined,
    supplierId: req.query.supplierId || undefined,
    dateFrom: req.query.dateFrom || undefined,
    dateTo: req.query.dateTo || undefined,
    sort: req.query.sort || 'CreatedDate',
    order: req.query.order || 'desc'
  };

  const result = await getOrdersService(filters);
  
  // Map orders to response format
  const orders = result.orders.map(mapOrderToResponse);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: orders,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  const order = await getOrderByIdService(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: mapOrderToResponse(order)
  });
});

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  try {
    const order = await createOrderService(req.body);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Customer not found') {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    if (error.message === 'Supplier not found') {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }
    if (error.message.includes('Product with ID') && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Update order
 * @route   PUT /api/orders/:id
 * @access  Private
 */
export const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    const order = await updateOrderService(orderId, req.body);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Delete order
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    await deleteOrderService(orderId);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    throw error;
  }
});

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    const order = await updateOrderStatusService(orderId, req.body);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (error.message.includes('already in this status') ||
        error.message.includes('Cannot update status')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Approve order
 * @route   PUT /api/orders/:id/approve
 * @access  Private
 */
export const approveOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    const order = await approveOrderService(orderId);

    res.status(200).json({
      success: true,
      message: 'Order approved successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (error.message.includes('Cannot approve')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Reject order
 * @route   PUT /api/orders/:id/reject
 * @access  Private
 */
export const rejectOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    const order = await rejectOrderService(orderId);

    res.status(200).json({
      success: true,
      message: 'Order rejected successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (error.message.includes('Cannot reject')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});

/**
 * @desc    Complete order
 * @route   PUT /api/orders/:id/complete
 * @access  Private
 */
export const completeOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orderId = parseInt(id);

  try {
    const order = await completeOrderService(orderId);

    res.status(200).json({
      success: true,
      message: 'Order completed successfully',
      data: mapOrderToResponse(order)
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (error.message.includes('Cannot complete')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    throw error;
  }
});
