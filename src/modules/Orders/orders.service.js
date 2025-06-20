import { prisma } from '../../config/prismaClient.js';
import crypto from 'crypto';

/**
 * Orders Service
 * Database operations and business logic for order management
 * Uses exact field names from the Order and OrderItem Prisma models
 */

/**
 * Get orders with pagination, search, and filtering
 */
export const getOrdersService = async (filters) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    customerId,
    supplierId,
    dateFrom,
    dateTo,
    sort = 'CreatedDate',
    order = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  
  // Build where clause
  const whereClause = {
    Deleted: false
  };

  // Add search filter (searches OrderNumber and Customer/Supplier names)
  if (search) {
    whereClause.OR = [
      {
        OrderNumber: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        Customer: {
          Users: {
            Name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      },
      {
        Suppliers: {
          Users: {
            Name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      }
    ];
  }

  // Add status filter
  if (status !== undefined) {
    whereClause.Status = status;
  }

  // Add customer filter
  if (customerId) {
    whereClause.CustomerId = customerId;
  }

  // Add supplier filter
  if (supplierId) {
    whereClause.SupplierId = supplierId;
  }

  // Add date range filter
  if (dateFrom || dateTo) {
    whereClause.CreatedDate = {};
    if (dateFrom) {
      whereClause.CreatedDate.gte = new Date(dateFrom);
    }
    if (dateTo) {
      whereClause.CreatedDate.lte = new Date(dateTo);
    }
  }

  // Build order by clause
  const orderBy = {};
  orderBy[sort] = order;

  // Execute query
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: whereClause,
      include: {
        Customer: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true,
                PhoneNumber: true
              }
            }
          }
        },
        Suppliers: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true,
                PhoneNumber: true
              }
            }
          }
        },
        OrderItem: {
          where: {
            Deleted: false
          },
          include: {
            Products: {
              select: {
                ID: true,
                Name: true,
                Price: true,
                SKU: true
              }
            }
          }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.order.count({
      where: whereClause
    })
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single order by ID
 */
export const getOrderByIdService = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: {
      ID: orderId,
      Deleted: false
    },
    include: {
      Customer: {
        include: {
          Users: {
            select: {
              Id: true,
              Name: true,
              Email: true,
              PhoneNumber: true,
              Address: true
            }
          }
        }
      },
      Suppliers: {
        include: {
          Users: {
            select: {
              Id: true,
              Name: true,
              Email: true,
              PhoneNumber: true,
              Address: true
            }
          }
        }
      },
      OrderItem: {
        where: {
          Deleted: false
        },
        include: {
          Products: {
            select: {
              ID: true,
              Name: true,
              Description: true,
              Price: true,
              SKU: true,
              Stock: true
            }
          }
        }
      }
    }
  });

  return order;
};

/**
 * Create new order with items
 */
export const createOrderService = async (orderData) => {
  const {
    CustomerId,
    SupplierId,
    items,
    DeliveryFees = 0,
    Discount = 0,
    Notes = '',
    PaymentMethod = 'cash'
  } = orderData;

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { Id: CustomerId }
  });
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Verify supplier exists
  const supplier = await prisma.suppliers.findUnique({
    where: { Id: SupplierId }
  });
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Verify all products exist and calculate subtotal
  let subTotal = 0;
  const productChecks = await Promise.all(
    items.map(async (item) => {
      const product = await prisma.products.findUnique({
        where: { ID: item.ProductId, Deleted: false }
      });
      if (!product) {
        throw new Error(`Product with ID ${item.ProductId} not found`);
      }
      if (product.Stock < item.Quantity) {
        throw new Error(`Insufficient stock for product ${product.Name}. Available: ${product.Stock}, Requested: ${item.Quantity}`);
      }
      subTotal += product.Price * item.Quantity;
      return { product, quantity: item.Quantity };
    })
  );

  // Generate unique order number
  const orderNumber = crypto.randomUUID();

  // Create order and order items in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({
      data: {
        CustomerId,
        SupplierId,
        SubTotal: subTotal,
        DeliveryFees,
        Discount,
        Notes,
        PaymentMethod,
        OrderNumber: orderNumber,
        Status: 0, // pending
        Deleted: false,
        CreatedDate: new Date(),
        UpdatedDate: new Date()
      }
    });

    // Create order items
    const orderItems = await Promise.all(
      items.map(async (item, index) => {
        const orderItem = await tx.orderItem.create({
          data: {
            OrderId: order.ID,
            ProductId: item.ProductId,
            Quantity: item.Quantity,
            Deleted: false,
            CreatedDate: new Date(),
            UpdatedDate: new Date()
          }
        });

        // Update product stock
        await tx.products.update({
          where: { ID: item.ProductId },
          data: {
            Stock: {
              decrement: item.Quantity
            },
            UpdatedDate: new Date()
          }
        });

        return orderItem;
      })
    );

    return { order, orderItems };
  });

  // Return the created order with full details
  return await getOrderByIdService(result.order.ID);
};

/**
 * Update order status
 */
export const updateOrderStatusService = async (orderId, statusData) => {
  const { status, Notes } = statusData;

  // Check if order exists
  const existingOrder = await getOrderByIdService(orderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // Validate status transition (basic validation)
  const currentStatus = existingOrder.Status;
  
  // Prevent updating to same status
  if (currentStatus === status) {
    throw new Error('Order is already in this status');
  }

  // Prevent updating cancelled or delivered orders
  if (currentStatus === 4 || currentStatus === 3) {
    throw new Error('Cannot update status of cancelled or delivered orders');
  }

  // Prepare update data
  const updateData = {
    Status: status,
    UpdatedDate: new Date()
  };

  // Add notes if provided
  if (Notes !== undefined) {
    updateData.Notes = Notes;
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { ID: orderId },
    data: updateData
  });

  // Return updated order with full details
  return await getOrderByIdService(orderId);
};
