import { prisma } from '../../config/prismaClient.js';
import { hashPassword } from '../../utils/hashing/hash.js';
import crypto from 'crypto';

/**
 * Suppliers Service
 * Database operations and business logic for supplier management
 * Uses exact field names from the Users and Suppliers Prisma models
 */

/**
 * Get suppliers with pagination, search, and filtering
 */
export const getSuppliersService = async (filters) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    verificationStatus,
    status,
    sort = 'updatedAt',
    order = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  
  // Build where clause
  const whereClause = {
    Suppliers: {
      isNot: null // Only get users who are suppliers
    }
  };

  // Add search filter (searches Name and Email)
  if (search) {
    whereClause.OR = [
      {
        Name: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        Email: {
          contains: search,
          mode: 'insensitive'
        }
      }
    ];
  }

  // Add verification status filter
  if (verificationStatus) {
    if (verificationStatus === 'verified') {
      whereClause.EmailConfirmed = true;
    } else if (verificationStatus === 'pending') {
      whereClause.EmailConfirmed = false;
    }
  }

  // Add status filter
  if (status) {
    if (status === 'active') {
      whereClause.LockoutEnabled = false;
    } else if (status === 'banned') {
      whereClause.LockoutEnabled = true;
    }
  }

  // Build order by clause
  const orderBy = {};
  if (sort === 'createdAt' || sort === 'updatedAt') {
    // These fields don't exist in Users table, so we'll use a proxy
    orderBy.Id = order; // Use Id as proxy for creation order
  } else {
    orderBy[sort] = order;
  }

  // Execute query
  const [suppliers, total] = await Promise.all([
    prisma.users.findMany({
      where: whereClause,
      include: {
        Suppliers: true // No need to include ActivityCategories
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.users.count({
      where: whereClause
    })
  ]);

  return {
    suppliers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single supplier by ID
 */
export const getSupplierByIdService = async (supplierId) => {
  const supplier = await prisma.users.findUnique({
    where: {
      Id: supplierId
    },
    include: {
      Suppliers: true, // No need to include ActivityCategories
      UserRoles: {
        include: {
          AspNetRoles: true
        }
      }
    }
  });

  // Check if user is actually a supplier
  if (supplier && !supplier.Suppliers) {
    return null;
  }

  return supplier;
};

/**
 * Get supplier products with pagination
 */
export const getSupplierProductsService = async (supplierId, filters) => {
  const {
    page = 1,
    limit = 10
  } = filters;

  const skip = (page - 1) * limit;

  // First verify supplier exists
  const supplier = await getSupplierByIdService(supplierId);
  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Build where clause for products
  const whereClause = {
    SupplierId: supplierId,
    Deleted: false
  };

  // Execute query
  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      include: {
        Categories: true,
        Images: {
          where: { Deleted: false }
        },
        ProductAttribute: {
          where: { Deleted: false }
        },
        ProductVariant: {
          where: { Deleted: false }
        }
      },
      orderBy: {
        CreatedDate: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.products.count({
      where: whereClause
    })
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Create new supplier
 */
export const createSupplierService = async (supplierData) => {
  const {
    email,
    password,
    phone,
    address,
    contactPerson,
    categories
  } = supplierData;

  // Check if email already exists
  const existingUser = await prisma.users.findFirst({
    where: {
      Email: email
    }
  });

  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const hashedPassword = hashPassword(password);

  // Generate unique ID
  const userId = crypto.randomUUID();

  // Create user and supplier in transaction
  await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.users.create({
      data: {
        Id: userId,
        Name: contactPerson, // Use contactPerson as Name
        Email: email,
        UserName: email, // Use email as username
        NormalizedUserName: email.toUpperCase(),
        NormalizedEmail: email.toUpperCase(),
        PasswordHash: hashedPassword,
        SecurityStamp: crypto.randomUUID(),
        ConcurrencyStamp: crypto.randomUUID(),
        PhoneNumber: phone || null,
        Address: address || null,
        BusinessType: categories || null, // Store categories in BusinessType
        EmailConfirmed: false, // Start as pending verification
        PhoneNumberConfirmed: false,
        TwoFactorEnabled: false,
        LockoutEnabled: false,
        AccessFailedCount: 0
      }
    });

    // Create supplier profile
    const supplier = await tx.suppliers.create({
      data: {
        Id: userId,
        
      }
    });

    return { user, supplier };
  });

  // Return the created supplier with category info
  return await getSupplierByIdService(userId);
};

/**
 * Update supplier verification status
 */
export const updateSupplierVerificationStatusService = async (supplierId, verificationStatus) => {
  // Check if supplier exists
  const existingSupplier = await getSupplierByIdService(supplierId);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  // Update verification status
  await prisma.users.update({
    where: { Id: supplierId },
    data: {
      EmailConfirmed: verificationStatus === 'verified',
      SecurityStamp: crypto.randomUUID() // Invalidate existing tokens
    }
  });

  return await getSupplierByIdService(supplierId);
};

/**
 * Ban supplier
 */
export const banSupplierService = async (supplierId) => {
  // Check if supplier exists
  const existingSupplier = await getSupplierByIdService(supplierId);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  // Ban supplier
  await prisma.users.update({
    where: { Id: supplierId },
    data: {
      LockoutEnabled: true,
      LockoutEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      SecurityStamp: crypto.randomUUID() // Invalidate existing tokens
    }
  });

  return await getSupplierByIdService(supplierId);
};

/**
 * Unban supplier
 */
export const unbanSupplierService = async (supplierId) => {
  // Check if supplier exists
  const existingSupplier = await getSupplierByIdService(supplierId);
  if (!existingSupplier) {
    throw new Error('Supplier not found');
  }

  // Unban supplier
  await prisma.users.update({
    where: { Id: supplierId },
    data: {
      LockoutEnabled: false,
      LockoutEnd: null,
      SecurityStamp: crypto.randomUUID() // Invalidate existing tokens
    }
  });

  return await getSupplierByIdService(supplierId);
};

/**
 * Delete supplier (hard delete with transaction to handle all foreign key constraints)
 */
export const deleteSupplierService = async (supplierId) => {
  // Check if supplier exists (using raw query to avoid any filtering)
  const existingSupplier = await prisma.users.findUnique({
    where: { Id: supplierId },
    include: { Suppliers: true }
  });

  if (!existingSupplier || !existingSupplier.Suppliers) {
    throw new Error('Supplier not found');
  }

  // Get counts of related data for reporting
  const [productCount, orderCount, notificationCount, paymentMethodCount, rateCount] = await Promise.all([
    prisma.products.count({ where: { SupplierId: supplierId } }),
    prisma.order.count({ where: { SupplierId: supplierId } }),
    prisma.notification.count({ where: { SupplierId: supplierId } }),
    prisma.paymentMethods.count({ where: { SupplierId: supplierId } }),
    prisma.rate.count({ where: { SupplierId: supplierId } })
  ]);

  // Execute transaction to handle all foreign key constraints
  await prisma.$transaction(async (tx) => {
    // Step 1: Handle Products - Remove supplier reference (make them unassigned)
    if (productCount > 0) {
      await tx.products.updateMany({
        where: { SupplierId: supplierId },
        data: {
          SupplierId: null, // Remove supplier reference
          UpdatedDate: new Date()
        }
      });
    }

    // Step 2: Handle Orders - Cancel pending orders, leave completed ones as-is
    if (orderCount > 0) {
      await tx.order.updateMany({
        where: {
          SupplierId: supplierId,
          Status: { in: [0, 1] } // Only pending (0) and processing (1) orders
        },
        data: {
          Status: 5, // Set to cancelled status
          UpdatedDate: new Date()
        }
      });
    }

    // Step 3: Handle Notifications - Soft delete them
    if (notificationCount > 0) {
      await tx.notification.updateMany({
        where: { SupplierId: supplierId },
        data: {
          Deleted: true,
          UpdatedDate: new Date()
        }
      });
    }

    // Step 4: Handle PaymentMethods - Remove supplier reference
    if (paymentMethodCount > 0) {
      await tx.paymentMethods.updateMany({
        where: { SupplierId: supplierId },
        data: {
          SupplierId: null, // Remove supplier reference
          UpdatedDate: new Date()
        }
      });
    }

    // Step 5: Handle Rates - Soft delete them
    if (rateCount > 0) {
      await tx.rate.updateMany({
        where: { SupplierId: supplierId },
        data: {
          Deleted: true,
          UpdatedDate: new Date()
        }
      });
    }

    // Step 6: Now safely delete the supplier record
    await tx.suppliers.delete({
      where: { Id: supplierId }
    });

    // Step 7: Delete the user account (this will cascade delete related user data)
    await tx.users.delete({
      where: { Id: supplierId }
    });
  });

  return {
    success: true,
    deletedData: {
      productsUpdated: productCount,
      ordersUpdated: orderCount,
      notificationsDeleted: notificationCount,
      paymentMethodsUpdated: paymentMethodCount,
      ratesDeleted: rateCount
    }
  };
};
