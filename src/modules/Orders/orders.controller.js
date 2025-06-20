import { asyncHandler } from '../../utils/error handling/asyncHandler.js';
import {
  getOrdersService,
  getOrderByIdService,
  createOrderService,
  updateOrderStatusService
} from './orders.service.js';

/**
 * Orders Controller
 * All responses use exact field names from the Order Prisma model
 * Maps database fields to API response format
 */

/**
 * Map order status number to readable string
 */
const getStatusString = (status) => {
  const statusMap = {
    0: 'pending',
    1: 'processing', 
    2: 'shipped',
    3: 'delivered',
    4: 'cancelled'
  };
  return statusMap[status] || 'unknown';
};

/**
 * Map database order to API response format
 */
const mapOrderToResponse = (order) => {
  if (!order) return null;

  // Calculate total
  const total = parseFloat(order.SubTotal) + parseFloat(order.DeliveryFees) - parseFloat(order.Discount);

  return {
    id: order.ID,
    orderNumber: order.OrderNumber,
    status: getStatusString(order.Status),
    statusCode: order.Status,
    subTotal: parseFloat(order.SubTotal),
    deliveryFees: parseFloat(order.DeliveryFees),
    discount: parseFloat(order.Discount),
    total: total,
    notes: order.Notes,
    paymentMethod: order.PaymentMethod,
    createdDate: order.CreatedDate,
    updatedDate: order.UpdatedDate,
    customer: order.Customer ? {
      id: order.Customer.Id,
      name: order.Customer.Users?.Name,
      email: order.Customer.Users?.Email,
      phone: order.Customer.Users?.PhoneNumber,
      address: order.Customer.Users?.Address
    } : null,
    supplier: order.Suppliers ? {
      id: order.Suppliers.Id,
      name: order.Suppliers.Users?.Name,
      email: order.Suppliers.Users?.Email,
      phone: order.Suppliers.Users?.PhoneNumber,
      address: order.Suppliers.Users?.Address
    } : null,
    items: order.OrderItem ? order.OrderItem.map(item => ({
      id: item.ID,
      productId: item.ProductId,
      quantity: item.Quantity,
      product: item.Products ? {
        id: item.Products.ID,
        name: item.Products.Name,
        description: item.Products.Description,
        price: parseFloat(item.Products.Price),
        sku: item.Products.SKU,
        stock: item.Products.Stock
      } : null,
      lineTotal: item.Products ? parseFloat(item.Products.Price) * item.Quantity : 0
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
