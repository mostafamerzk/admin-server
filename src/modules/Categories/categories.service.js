import { prisma } from '../../config/prismaClient.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary.js';
import { getCategoryProductCount, buildProductWhereClause } from '../../utils/product-filtering.js';

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

  };

  // Map sort field to database field
  const sortFieldMap = {
    'name': 'Name',
    'createdAt': 'CreatedDate',
    'updatedAt': 'UpdatedDate',
    'productCount': 'Name' // Fallback to Name since we'll calculate productCount separately
  };

  const orderBy = { [sortFieldMap[sort] || 'UpdatedDate']: order };

  // Execute query - get categories without product count first
  const [categories, total] = await Promise.all([
    prisma.categories.findMany({
      where: whereClause,
      orderBy,
      skip,
      take: limit
    }),
    prisma.categories.count({
      where: whereClause
    })
  ]);

  // Calculate consistent product count for each category using shared filtering logic
  const categoriesWithProductCount = await Promise.all(
    categories.map(async (category) => {
      const productCount = await getCategoryProductCount(prisma, category.ID);
      return {
        ...category,
        _count: {
          Products: productCount
        }
      };
    })
  );

  return {
    categories: categoriesWithProductCount,
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
    }
  });

  if (!category) {
    return null;
  }

  // Calculate consistent product count using shared filtering logic
  const productCount = await getCategoryProductCount(prisma, category.ID);

  return {
    ...category,
    _count: {
      Products: productCount
    }
  };
};

/**
 * Create new category with optional image upload
 */
export const createCategoryService = async (categoryData, imageFile = null) => {
  const { name, description, status, imageUrl } = categoryData;
  let finalImageUrl = null;

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

  // Handle image upload if file is provided
  if (imageFile) {
    try {
      const publicId = `category_${Date.now()}`;
      const result = await uploadToCloudinary(imageFile.buffer, 'categories', publicId);
      finalImageUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Error uploading category image:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
  } else if (imageUrl) {
    // Use provided image URL if no file was uploaded
    finalImageUrl = imageUrl;
  }

  // Create category with image URL
  const category = await prisma.categories.create({
    data: {
      Name: name,
      Description: description,
      imageUrl: finalImageUrl,
      Deleted: false,
      CreatedDate: new Date(),
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  return category;
};

/**
 * Update category
 */
export const updateCategoryService = async (categoryId, updateData) => {
  const { name, description, status } = updateData;

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

  // Update category (image will be handled by separate endpoint)
  const updatedCategory = await prisma.categories.update({
    where: {
      ID: parseInt(categoryId)
    },
    data: {
      ...(name && { Name: name }),
      ...(description && { Description: description }),
      ...(status && { Deleted: status === 'inactive' }),
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  return updatedCategory;
};

/**
 * Ban category and all its products using transaction
 */
export const banCategoryService = async (categoryId) => {
  // Check if category exists
  const existingCategory = await getCategoryByIdService(categoryId);
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Check if category is already banned
  if (existingCategory.Deleted) {
    throw new Error('Category is already banned');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Ban the category
    const bannedCategory = await tx.categories.update({
      where: {
        ID: parseInt(categoryId)
      },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      },
      include: {
        _count: {
          select: { Products: true }
        }
      }
    });

    // Ban all products in this category that are not already banned
    const bannedProductsResult = await tx.products.updateMany({
      where: {
        CategoryId: parseInt(categoryId),
        Deleted: false
      },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      }
    });

    return {
      category: bannedCategory,
      bannedProductsCount: bannedProductsResult.count
    };
  });

  return result;
};

/**
 * Unban category and all its products using transaction
 */
export const unbanCategoryService = async (categoryId) => {
  // Check if category exists (including banned ones)
  const existingCategory = await prisma.categories.findUnique({
    where: {
      ID: parseInt(categoryId)
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Check if category is already active
  if (!existingCategory.Deleted) {
    throw new Error('Category is already active');
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Unban the category
    const unbannedCategory = await tx.categories.update({
      where: {
        ID: parseInt(categoryId)
      },
      data: {
        Deleted: false,
        UpdatedDate: new Date()
      },
      include: {
        _count: {
          select: { Products: true }
        }
      }
    });

    // Unban all products in this category that are currently banned
    const unbannedProductsResult = await tx.products.updateMany({
      where: {
        CategoryId: parseInt(categoryId),
        Deleted: true
      },
      data: {
        Deleted: false,
        UpdatedDate: new Date()
      }
    });

    return {
      category: unbannedCategory,
      unbannedProductsCount: unbannedProductsResult.count
    };
  });

  return result;
};

/**
 * Update category status and cascade to products using transaction
 */
export const updateCategoryStatusService = async (categoryId, status) => {
  // Check if category exists
  const existingCategory = await prisma.categories.findUnique({
    where: {
      ID: parseInt(categoryId)
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Map status to Deleted field
  const isDeleted = status === 'inactive';

  // Check if category is already in the requested status
  if (existingCategory.Deleted === isDeleted) {
    throw new Error(`Category is already ${status}`);
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update the category status
    const updatedCategory = await tx.categories.update({
      where: {
        ID: parseInt(categoryId)
      },
      data: {
        Deleted: isDeleted,
        UpdatedDate: new Date()
      },
      include: {
        _count: {
          select: { Products: true }
        }
      }
    });

    // Update all products in this category to match the category status
    const updatedProductsResult = await tx.products.updateMany({
      where: {
        CategoryId: parseInt(categoryId),
        Deleted: !isDeleted // Only update products that have different status
      },
      data: {
        Deleted: isDeleted,
        UpdatedDate: new Date()
      }
    });

    return {
      category: updatedCategory,
      updatedProductsCount: updatedProductsResult.count
    };
  });

  return result;
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

  // Check if category has associated products (both active and deleted)
  const productCount = await prisma.products.count({
    where: {
      CategoryId: parseInt(categoryId)
    }
  });

  if (productCount > 0) {
    throw new Error('Cannot delete category with associated products');
  }

  // Delete image from Cloudinary if it exists
  if (existingCategory.imageUrl) {
    try {
      // Extract public_id from the Cloudinary URL
      const urlParts = existingCategory.imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;

      await deleteFromCloudinary(publicId);
    } catch (deleteError) {
      console.warn('Warning: Could not delete category image from Cloudinary:', deleteError.message);
      // Continue with category deletion even if image deletion fails
    }
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
    search = ''
  } = filters;

  const skip = (page - 1) * limit;

  // Use shared filtering logic for consistency
  const whereClause = buildProductWhereClause({
    category: parseInt(categoryId),
    search
  });

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

/**
 * Upload category image
 */
export const uploadCategoryImageService = async (categoryId, imageUrl) => {
  // Check if category exists
  const existingCategory = await prisma.categories.findUnique({
    where: { ID: categoryId, Deleted: false }
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Delete old image from Cloudinary if it exists and is a Cloudinary URL
  if (existingCategory.imageUrl && existingCategory.imageUrl.includes('cloudinary.com')) {
    try {
      const urlParts = existingCategory.imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
      await deleteFromCloudinary(publicId);
    } catch (deleteError) {
      console.warn('Warning: Could not delete old category image from Cloudinary:', deleteError.message);
      // Continue with upload even if delete fails
    }
  }

  // Update category with new image URL
  const updatedCategory = await prisma.categories.update({
    where: { ID: categoryId },
    data: {
      imageUrl: imageUrl,
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  return updatedCategory;
};

/**
 * Delete category image
 */
export const deleteCategoryImageService = async (categoryId) => {
  // Check if category exists
  const existingCategory = await prisma.categories.findUnique({
    where: { ID: categoryId, Deleted: false }
  });

  if (!existingCategory) {
    throw new Error('Category not found');
  }

  if (!existingCategory.imageUrl) {
    throw new Error('Category has no image to delete');
  }

  // Delete image from Cloudinary if it's a Cloudinary URL
  if (existingCategory.imageUrl.includes('cloudinary.com')) {
    try {
      const urlParts = existingCategory.imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
      await deleteFromCloudinary(publicId);
    } catch (deleteError) {
      console.warn('Warning: Could not delete category image from Cloudinary:', deleteError.message);
      // Continue with database update even if Cloudinary delete fails
    }
  }

  // Update category to remove image URL
  const updatedCategory = await prisma.categories.update({
    where: { ID: categoryId },
    data: {
      imageUrl: null,
      UpdatedDate: new Date()
    },
    include: {
      _count: {
        select: { Products: true }
      }
    }
  });

  return updatedCategory;
};
