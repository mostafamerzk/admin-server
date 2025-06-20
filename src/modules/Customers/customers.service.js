import { prisma } from '../../config/prismaClient.js';
import { hashPassword } from '../../utils/hashing/hash.js';
import crypto from 'crypto';

/**
 * Customer Service
 * Database operations and business logic for customer management
 * Uses exact field names from the Users and Customer Prisma models
 */

/**
 * Get customers with pagination, search, and filtering
 */
export const getCustomersService = async (filters) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    sort = 'updatedAt',
    order = 'desc'
  } = filters;

  const skip = (page - 1) * limit;
  
  // Build where clause
  const whereClause = {
    Customer: {
      isNot: null // Only get users who are customers
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
    // Since there's no CreatedDate in Users, we'll use Order data as proxy
    orderBy.Id = order; // Use Id as proxy for creation order
  } else {
    orderBy[sort] = order;
  }

  // Execute query
  const [customers, total] = await Promise.all([
    prisma.users.findMany({
      where: whereClause,
      include: {
        Customer: true
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
    customers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single customer by ID
 */
export const getCustomerByIdService = async (customerId) => {
  const customer = await prisma.users.findUnique({
    where: {
      Id: customerId
    },
    include: {
      Customer: true,
      UserRoles: {
        include: {
          AspNetRoles: true
        }
      }
    }
  });

  // Check if user is actually a customer
  if (customer && !customer.Customer) {
    return null;
  }

  return customer;
};

/**
 * Create new customer
 */
export const createCustomerService = async (customerData) => {
  const {
    Name,
    Email,
    password,
    PhoneNumber,
    Address,
    BusinessType,
    verificationStatus = 'pending'
  } = customerData;

  // Check if email already exists
  const existingUser = await prisma.users.findFirst({
    where: {
      Email: Email
    }
  });

  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password
  const hashedPassword = hashPassword(password);
  
  // Generate user ID
  const userId = crypto.randomUUID();
  
  // Create user and customer in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.users.create({
      data: {
        Id: userId,
        Name,
        Email,
        UserName: Email, // Use email as username
        NormalizedUserName: Email.toUpperCase(),
        NormalizedEmail: Email.toUpperCase(),
        PasswordHash: hashedPassword,
        SecurityStamp: crypto.randomUUID(),
        ConcurrencyStamp: crypto.randomUUID(),
        PhoneNumber: PhoneNumber || null,
        Address: Address || null,
        BusinessType: BusinessType || null,
        EmailConfirmed: verificationStatus === 'verified',
        PhoneNumberConfirmed: false,
        TwoFactorEnabled: false,
        LockoutEnabled: false,
        AccessFailedCount: 0
      }
    });

    // Create customer profile
    const customer = await tx.Customer.create({
      data: {
        Id: userId
      }
    });

    return { user, customer };
  });

  // Return the created user with customer relationship
  return await prisma.users.findUnique({
    where: { Id: userId },
    include: {
      Customer: true
    }
  });
};

/**
 * Update customer
 */
export const updateCustomerService = async (customerId, updateData) => {
  const {
    Name,
    Email,
    password,
    PhoneNumber,
    Address,
    BusinessType,
    verificationStatus
  } = updateData;

  // Check if customer exists
  const existingCustomer = await getCustomerByIdService(customerId);
  if (!existingCustomer) {
    throw new Error('Customer not found');
  }

  // Check if email is being updated and already exists
  if (Email && Email !== existingCustomer.Email) {
    const emailExists = await prisma.users.findFirst({
      where: {
        Email: Email,
        Id: { not: customerId }
      }
    });

    if (emailExists) {
      throw new Error('Email already exists');
    }
  }

  // Prepare update data
  const updateFields = {};
  
  if (Name !== undefined) updateFields.Name = Name;
  if (Email !== undefined) {
    updateFields.Email = Email;
    updateFields.UserName = Email;
    updateFields.NormalizedUserName = Email.toUpperCase();
    updateFields.NormalizedEmail = Email.toUpperCase();
  }
  if (password !== undefined) {
    updateFields.PasswordHash = hashPassword(password);
    updateFields.SecurityStamp = crypto.randomUUID(); // Invalidate existing tokens
  }
  if (PhoneNumber !== undefined) updateFields.PhoneNumber = PhoneNumber;
  if (Address !== undefined) updateFields.Address = Address;
  if (BusinessType !== undefined) updateFields.BusinessType = BusinessType;
  if (verificationStatus !== undefined) {
    updateFields.EmailConfirmed = verificationStatus === 'verified';
  }

  // Update user
  const updatedUser = await prisma.users.update({
    where: { Id: customerId },
    data: updateFields,
    include: {
      Customer: true
    }
  });

  return updatedUser;
};

/**
 * Delete customer
 */
export const deleteCustomerService = async (customerId) => {
  // Check if customer exists
  const existingCustomer = await getCustomerByIdService(customerId);
  if (!existingCustomer) {
    throw new Error('Customer not found');
  }

  // Delete customer (this will cascade delete the user due to FK constraint)
  await prisma.Customer.delete({
    where: { Id: customerId }
  });

  return true;
};

/**
 * Update customer status (active/banned)
 */
export const updateCustomerStatusService = async (customerId, status) => {
  // Check if customer exists
  const existingCustomer = await getCustomerByIdService(customerId);
  if (!existingCustomer) {
    throw new Error('Customer not found');
  }

  // Update lockout status based on the status
  const updateData = {
    LockoutEnabled: status === 'banned'
  };

  // If banning, set lockout end to far future
  if (status === 'banned') {
    updateData.LockoutEnd = new Date('2099-12-31');
  } else {
    updateData.LockoutEnd = null;
  }

  const updatedUser = await prisma.users.update({
    where: { Id: customerId },
    data: updateData,
    include: {
      Customer: true
    }
  });

  return updatedUser;
};
