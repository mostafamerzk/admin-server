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
      Deleted: status === 'inactive',
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
 * Update category with optional image upload (atomic operation)
 * This is the enhanced version that handles both data and image updates atomically.
 * The separate image upload/delete services are maintained for backward compatibility.
 */
export const updateCategoryService = async (categoryId, updateData, imageFile = null) => {
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
        ID: { not: parseInt(categoryId) }
      }
    });

    if (nameConflict) {
      throw new Error('Category name already exists');
    }
  }

  let newImageUrl = null;
  let newImagePublicId = null;
  let shouldDeleteOldImage = false;

  try {
    // Handle image upload if file is provided
    if (imageFile) {
      try {
        const publicId = `category_${categoryId}_${Date.now()}`;
        const result = await uploadToCloudinary(imageFile.buffer, 'categories', publicId);
        newImageUrl = result.secure_url;
        newImagePublicId = result.public_id;
        shouldDeleteOldImage = true;
      } catch (uploadError) {
        console.error('Error uploading category image:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }
    } else if (updateData.imageUrl !== undefined) {
      // Handle explicit imageUrl update (including null to remove image)
      newImageUrl = updateData.imageUrl;
      shouldDeleteOldImage = updateData.imageUrl === null && existingCategory.imageUrl;
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update category with all data including new image URL
      const updatedCategory = await tx.categories.update({
        where: {
          ID: parseInt(categoryId)
        },
        data: {
          ...(name && { Name: name }),
          ...(description && { Description: description }),
          ...(status && { Deleted: status === 'inactive' }),
          ...(newImageUrl !== null && { imageUrl: newImageUrl }),
          ...(newImageUrl === null && updateData.imageUrl === null && { imageUrl: null }),
          UpdatedDate: new Date()
        },
        include: {
          _count: {
            select: { Products: true }
          }
        }
      });

      return {
        category: updatedCategory,
        oldImageUrl: existingCategory.imageUrl,
        shouldDeleteOldImage
      };
    });

    // Delete old image from Cloudinary only after successful database update
    if (result.shouldDeleteOldImage && result.oldImageUrl && result.oldImageUrl.includes('cloudinary.com')) {
      try {
        const urlParts = result.oldImageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const oldPublicId = `categories/${publicIdWithExtension.split('.')[0]}`;
        await deleteFromCloudinary(oldPublicId);
      } catch (deleteError) {
        console.warn('Warning: Could not delete old category image from Cloudinary:', deleteError.message);
        // Don't throw error here as the main operation succeeded
      }
    }

    return result.category;

  } catch (error) {
    // Rollback: Delete newly uploaded image if database operation failed
    if (newImagePublicId) {
      try {
        await deleteFromCloudinary(newImagePublicId);
      } catch (rollbackError) {
        console.error('Error during image rollback:', rollbackError.message);
      }
    }
    throw error;
  }
};

/**
 * Ban category and all its products using transaction
 */
// export const banCategoryService = async (categoryId) => {
//   // Check if category exists
//   const existingCategory = await getCategoryByIdService(categoryId);
//   if (!existingCategory) {
//     throw new Error('Category not found');
//   }

//   // Check if category is already banned
//   if (existingCategory.Deleted) {
//     throw new Error('Category is already banned');
//   }

//   // Use transaction to ensure atomicity
//   const result = await prisma.$transaction(async (tx) => {
//     // Ban the category
//     const bannedCategory = await tx.categories.update({
//       where: {
//         ID: parseInt(categoryId)
//       },
//       data: {
//         Deleted: true,
//         UpdatedDate: new Date()
//       },
//       include: {
//         _count: {
//           select: { Products: true }
//         }
//       }
//     });

//     // Ban all products in this category that are not already banned
//     const bannedProductsResult = await tx.products.updateMany({
//       where: {
//         CategoryId: parseInt(categoryId),
//         Deleted: false
//       },
//       data: {
//         Deleted: true,
//         UpdatedDate: new Date()
//       }
//     });

//     return {
//       category: bannedCategory,
//       bannedProductsCount: bannedProductsResult.count
//     };
//   });

//   return result;
// };

// /**
//  * Unban category and all its products using transaction
//  */
// export const unbanCategoryService = async (categoryId) => {
//   // Check if category exists (including banned ones)
//   const existingCategory = await prisma.categories.findUnique({
//     where: {
//       ID: parseInt(categoryId)
//     },
//     include: {
//       _count: {
//         select: { Products: true }
//       }
//     }
//   });

//   if (!existingCategory) {
//     throw new Error('Category not found');
//   }

//   // Check if category is already active
//   if (!existingCategory.Deleted) {
//     throw new Error('Category is already active');
//   }

//   // Use transaction to ensure atomicity
//   const result = await prisma.$transaction(async (tx) => {
//     // Unban the category
//     const unbannedCategory = await tx.categories.update({
//       where: {
//         ID: parseInt(categoryId)
//       },
//       data: {
//         Deleted: false,
//         UpdatedDate: new Date()
//       },
//       include: {
//         _count: {
//           select: { Products: true }
//         }
//       }
//     });

//     // Unban all products in this category that are currently banned
//     const unbannedProductsResult = await tx.products.updateMany({
//       where: {
//         CategoryId: parseInt(categoryId),
//         Deleted: true
//       },
//       data: {
//         Deleted: false,
//         UpdatedDate: new Date()
//       }
//     });

//     return {
//       category: unbannedCategory,
//       unbannedProductsCount: unbannedProductsResult.count
//     };
//   });

//   return result;
// };

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
 * Delete category (hard delete with cascading)
 * Permanently removes category and all related products from database
 */
export const deleteCategoryService = async (categoryId) => {
  // Check if category exists
  const existingCategory = await getCategoryByIdService(categoryId);
  if (!existingCategory) {
    throw new Error('Category not found');
  }

  // Get all products in this category for cleanup operations
  const categoryProducts = await prisma.products.findMany({
    where: {
      CategoryId: parseInt(categoryId)
    },
    include: {
      Images: {
        select: {
          ID: true,
          Url: true
        }
      }
    }
  });

  // Collect all Cloudinary images that need to be deleted
  const imagesToDelete = [];

  // Add category image if it exists
  if (existingCategory.imageUrl && existingCategory.imageUrl.includes('cloudinary.com')) {
    try {
      const urlParts = existingCategory.imageUrl.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `categories/${publicIdWithExtension.split('.')[0]}`;
      imagesToDelete.push(publicId);
    } catch (error) {
      console.warn('Warning: Could not parse category image URL for deletion:', error.message);
    }
  }

  // Add product images
  categoryProducts.forEach(product => {
    product.Images.forEach(image => {
      if (image.Url && image.Url.includes('cloudinary.com')) {
        try {
          const urlParts = image.Url.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = `products/${publicIdWithExtension.split('.')[0]}`;
          imagesToDelete.push(publicId);
        } catch (error) {
          console.warn('Warning: Could not parse product image URL for deletion:', error.message);
        }
      }
    });
  });

  // Perform hard deletion in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Delete all related data for products in this category
    // Delete product images
    await tx.images.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete product attributes
    await tx.productAttribute.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete product variants
    await tx.productVariant.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete reviews for products in this category
    await tx.reviews.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete cart items for products in this category
    await tx.cartItem.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete wishlist items for products in this category
    await tx.wishlistItem.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Delete order items for products in this category
    await tx.orderItem.deleteMany({
      where: {
        Products: {
          CategoryId: parseInt(categoryId)
        }
      }
    });

    // Step 2: Delete all products in this category
    const deletedProductsResult = await tx.products.deleteMany({
      where: {
        CategoryId: parseInt(categoryId)
      }
    });

    // Step 3: Delete the category itself
    await tx.categories.delete({
      where: {
        ID: parseInt(categoryId)
      }
    });

    return {
      categoryId: parseInt(categoryId),
      categoryName: existingCategory.Name,
      deletedProductsCount: deletedProductsResult.count,
      imagesToCleanup: imagesToDelete.length
    };
  });

  // Step 4: Clean up Cloudinary images (non-blocking)
  // This is done outside the transaction to avoid blocking database operations
  if (imagesToDelete.length > 0) {
    Promise.all(
      imagesToDelete.map(async (publicId) => {
        try {
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.warn(`Warning: Could not delete image from Cloudinary (${publicId}):`, deleteError.message);
        }
      })
    ).catch(error => {
      console.error('Error during batch Cloudinary cleanup:', error.message);
    });
  }

  return result;
};

/**
 * Get category products
 */
// export const getCategoryProductsService = async (categoryId, filters = {}) => {
//   const {
//     page = 1,
//     limit = 10,
//     search = ''
//   } = filters;

//   const skip = (page - 1) * limit;

//   // Use shared filtering logic for consistency
//   const whereClause = buildProductWhereClause({
//     category: parseInt(categoryId),
//     search
//   });

//   const [products, total] = await Promise.all([
//     prisma.products.findMany({
//       where: whereClause,
//       orderBy: { UpdatedDate: 'desc' },
//       skip,
//       take: limit
//     }),
//     prisma.products.count({
//       where: whereClause
//     })
//   ]);

//   return {
//     products,
//     pagination: {
//       page,
//       limit,
//       total,
//       pages: Math.ceil(total / limit)
//     }
//   };
// };

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
