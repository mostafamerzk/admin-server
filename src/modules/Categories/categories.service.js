import { prisma } from '../../config/prismaClient.js';

/**
 * Categories Service
 * Database operations and business logic for category management
 * Uses exact field names from the Categories Prisma model
 */

/**
 * Get categories with pagination, search, and filtering
 */
export const getCategoriesService = async (filters) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status,
    sort = 'UpdatedDate',
    order = 'desc'
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause = {
    Deleted: false,
    ...(search && {
      OR: [
        { Name: { contains: search, mode: 'insensitive' } },
        { Description: { contains: search, mode: 'insensitive' } }
      ]
    })
    // Note: Status field doesn't exist in current Prisma schema
    // ...(status && { Status: status })
  };

  // Map sort field to database field
  const sortFieldMap = {
    'name': 'Name',
    'createdAt': 'CreatedDate',
    'updatedAt': 'UpdatedDate',
    'productCount': 'Name' // Fallback to Name since we'll calculate productCount separately
  };

  const orderBy = { [sortFieldMap[sort] || 'UpdatedDate']: order };

  // Execute query
  const [categories, total] = await Promise.all([
    prisma.categories.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { Products: { where: { Deleted: false } } }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.categories.count({
      where: whereClause
    })
  ]);

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get single category by ID
 */
export const getCategoryByIdService = async (categoryId) => {
  const category = await prisma.categories.findUnique({
    where: {
      ID: parseInt(categoryId),
      Deleted: false
    },
    include: {
      _count: {
        select: { Products: { where: { Deleted: false } } }
      }
    }
  });

  return category;
};

/**
 * Create new category
 */
export const createCategoryService = async (categoryData) => {
  const { name, description, status, image } = categoryData;

  // Check if category name already exists
  const existingCategory = await prisma.categories.findFirst({
    where: {
      Name: name,
      Deleted: false
    }
  });

  if (existingCategory) {
    throw new Error('Category name already exists');
  }

  // Create category (Note: Status and Image fields don't exist in current schema)
  const category = await prisma.categories.create({
    data: {
      Name: name,
      Description: description,
      Deleted: false,
      CreatedDate: new Date(),
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: { where: { Deleted: false } } }
      }
    }
  });

  return category;
};

/**
 * Update category
 */
export const updateCategoryService = async (categoryId, updateData) => {
  const { name, description, status, image } = updateData;

  // Check if category exists
  const existingCategory = await getCategoryByIdService(categoryId);
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Check if new name conflicts with existing category
  if (name && name !== existingCategory.Name) {
    const nameConflict = await prisma.categories.findFirst({
      where: {
        Name: name,
        Deleted: false,
        ID: { not: parseInt(categoryId) }
      }
    });

    if (nameConflict) {
      throw new Error('Category name already exists');
    }
  }

  // Update category (Note: Status and Image fields don't exist in current schema)
  const updatedCategory = await prisma.categories.update({
    where: {
      ID: parseInt(categoryId)
    },
    data: {
      ...(name && { Name: name }),
      ...(description && { Description: description }),
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: { where: { Deleted: false } } }
      }
    }
  });

  return updatedCategory;
};

/**
 * Delete category (soft delete)
 */
export const deleteCategoryService = async (categoryId) => {
  // Check if category exists
  const existingCategory = await getCategoryByIdService(categoryId);
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Check if category has associated products
  const productCount = await prisma.products.count({
    where: {
      CategoryId: parseInt(categoryId),
      Deleted: false
    }
  });

  if (productCount > 0) {
    throw new Error('Cannot delete category with associated products');
  }

  // Soft delete category
  await prisma.categories.update({
    where: {
      ID: parseInt(categoryId)
    },
    data: {
      Deleted: true,
      UpdatedDate: new Date()
    }
  });

  return true;
};

/**
 * Get category products
 */
export const getCategoryProductsService = async (categoryId, filters = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status
  } = filters;

  const skip = (page - 1) * limit;

  // Build where clause for products
  const whereClause = {
    CategoryId: parseInt(categoryId),
    Deleted: false,
    ...(search && {
      OR: [
        { Name: { contains: search, mode: 'insensitive' } },
        { Description: { contains: search, mode: 'insensitive' } }
      ]
    })
    // Note: Status field for products would need to be checked in actual schema
  };

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      orderBy: { UpdatedDate: 'desc' },
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
