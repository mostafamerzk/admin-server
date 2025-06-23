import { prisma } from '../../config/prismaClient.js';
import { buildProductWhereClause, buildProductOrderBy, calculatePagination } from '../../utils/product-filtering.js';

/**
 * Products Service
 * All database operations for products management
 * Uses exact field names from the Products Prisma model
 */

/**
 * Get products with filtering and pagination
 */
export const getProductsService = async (filters) => {
  const { page, limit, search, category, supplierId, inStock, deleted, sort, order } = filters;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Use shared filtering logic for consistency
  const whereClause = buildProductWhereClause({
    search,
    category,
    supplierId,
    inStock,
    deleted
  });

  // Use shared order by logic
  const orderBy = buildProductOrderBy(sort, order);
  
  // Execute query
  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where: whereClause,
      include: {
        Categories: {
          select: {
            ID: true,
            Name: true,
            Description: true
          }
        },
        Suppliers: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true
              }
            }
          }
        },
        Customer: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true
              }
            }
          }
        },
        Images: {
          select: {
            ID: true,
            Url: true,
            Deleted: true // Include deleted status for images too
          }
        },
        ProductAttribute: {
          select: {
            ID: true,
            Key: true,
            Value: true,
            Deleted: true // Include deleted status for attributes too
          }
        },
        ProductVariant: {
          select: {
            ID: true,
            Name: true,
            Type: true,
            CustomPrice: true,
            Stock: true,
            Deleted: true // Include deleted status for variants too
          }
        }
      },
      orderBy: {
        ID: 'asc' // Order by ID for consistent results
      }
    }),
    prisma.products.count({
      where: whereClause
    })
  ]);
  
  return {
    products,
    pagination: calculatePagination(page, limit, total)
  };
};

/**
 * Get single product by ID
 */
export const getProductByIdService = async (productId) => {
  const product = await prisma.products.findUnique({
    where: {
      ID: productId,
      Deleted: false
    },
    include: {
      Categories: {
        select: {
          ID: true,
          Name: true,
          Description: true
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
      Customer: {
        include: {
          Users: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      },
      Images: {
        where: { Deleted: false },
        select: {
          ID: true,
          Url: true
        }
      },
      ProductAttribute: {
        where: { Deleted: false },
        select: {
          ID: true,
          Key: true,
          Value: true
        }
      },
      ProductVariant: {
        where: { Deleted: false },
        select: {
          ID: true,
          Name: true,
          Type: true,
          CustomPrice: true,
          Stock: true
        }
      },
      Reviews: {
        where: { Deleted: false },
        select: {
          ID: true,
          Rate: true,
          Body: true,
          CreatedDate: true,
          Customer: {
            include: {
              Users: {
                select: {
                  Id: true,
                  Name: true
                }
              }
            }
          }
        }
      }
    }
  });
  
  return product;
};

/**
 * Create new product
 */
export const createProductService = async (productData) => {
  const { Attributes, Variants, ...productFields } = productData;
  
  // Verify category exists
  if (productFields.CategoryId) {
    const category = await prisma.categories.findUnique({
      where: { ID: productFields.CategoryId, Deleted: false }
    });
    if (!category) {
      throw new Error('Category not found');
    }
  }
  
  // Verify supplier exists if provided
  if (productFields.SupplierId) {
    const supplier = await prisma.suppliers.findUnique({
      where: { Id: productFields.SupplierId }
    });
    if (!supplier) {
      throw new Error('Supplier not found');
    }
  }
  
  // Verify customer exists if provided
  if (productFields.CustomerId) {
    const customer = await prisma.customer.findUnique({
      where: { Id: productFields.CustomerId }
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
  }
  
  // Create product with related data
  const product = await prisma.products.create({
    data: {
      ...productFields,
      Deleted: false,
      CreatedDate: new Date(),
      // Create attributes if provided
      ...(Attributes && Attributes.length > 0 && {
        ProductAttribute: {
          create: Attributes.map(attr => ({
            Key: attr.Key,
            Value: attr.Value,
            Deleted: false,
            CreatedDate: new Date()
          }))
        }
      }),
      // Create variants if provided
      ...(Variants && Variants.length > 0 && {
        ProductVariant: {
          create: Variants.map(variant => ({
            Name: variant.Name,
            Type: variant.Type,
            CustomPrice: variant.CustomPrice,
            Stock: variant.Stock,
            Deleted: false,
            CreatedDate: new Date()
          }))
        }
      })
    },
    include: {
      Categories: true,
      Suppliers: {
        include: {
          Users: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      },
      Customer: {
        include: {
          Users: {
            select: {
              Id: true,
              Name: true,
              Email: true
            }
          }
        }
      },
      Images: {
        where: { Deleted: false }
      },
      ProductAttribute: {
        where: { Deleted: false }
      },
      ProductVariant: {
        where: { Deleted: false }
      }
    }
  });
  
  return product;
};

/**
 * Update existing product with attributes and variants
 */
export const updateProductService = async (productId, updateData) => {
  const { Attributes, Variants, ...productFields } = updateData;

  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId, Deleted: false }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Verify category exists if being updated
  if (productFields.CategoryId) {
    const category = await prisma.categories.findUnique({
      where: { ID: productFields.CategoryId, Deleted: false }
    });
    if (!category) {
      throw new Error('Category not found');
    }
  }

  // Verify supplier exists if being updated
  if (productFields.SupplierId) {
    const supplier = await prisma.suppliers.findUnique({
      where: { Id: productFields.SupplierId }
    });
    if (!supplier) {
      throw new Error('Supplier not found');
    }
  }

  // Verify customer exists if being updated
  if (productFields.CustomerId) {
    const customer = await prisma.customer.findUnique({
      where: { Id: productFields.CustomerId }
    });
    if (!customer) {
      throw new Error('Customer not found');
    }
  }

  // Use transaction to update product and related data
  const product = await prisma.$transaction(async (tx) => {
    // Update basic product fields
    const updatedProduct = await tx.products.update({
      where: { ID: productId },
      data: {
        ...productFields,
        UpdatedDate: new Date()
      }
    });

    // Handle attributes updates
    if (Attributes && Array.isArray(Attributes)) {
      for (const attribute of Attributes) {
        const action = attribute._action || 'create';

        if (action === 'create') {
          // Create new attribute
          await tx.productAttribute.create({
            data: {
              ProductId: productId,
              Key: attribute.Key,
              Value: attribute.Value,
              Deleted: false,
              CreatedDate: new Date()
            }
          });
        } else if (action === 'update' && attribute.ID) {
          // Update existing attribute
          await tx.productAttribute.update({
            where: {
              ID: attribute.ID,
              ProductId: productId,
              Deleted: false
            },
            data: {
              Key: attribute.Key,
              Value: attribute.Value,
              UpdatedDate: new Date()
            }
          });
        } else if (action === 'delete' && attribute.ID) {
          // Soft delete attribute
          await tx.productAttribute.update({
            where: {
              ID: attribute.ID,
              ProductId: productId
            },
            data: {
              Deleted: true,
              UpdatedDate: new Date()
            }
          });
        }
      }
    }

    // Handle variants updates
    if (Variants && Array.isArray(Variants)) {
      for (const variant of Variants) {
        const action = variant._action || 'create';

        if (action === 'create') {
          // Create new variant
          await tx.productVariant.create({
            data: {
              ProductId: productId,
              Name: variant.Name,
              Type: variant.Type,
              CustomPrice: variant.CustomPrice,
              Stock: variant.Stock,
              Deleted: false,
              CreatedDate: new Date()
            }
          });
        } else if (action === 'update' && variant.ID) {
          // Update existing variant
          await tx.productVariant.update({
            where: {
              ID: variant.ID,
              ProductId: productId,
              Deleted: false
            },
            data: {
              Name: variant.Name,
              Type: variant.Type,
              CustomPrice: variant.CustomPrice,
              Stock: variant.Stock,
              UpdatedDate: new Date()
            }
          });
        } else if (action === 'delete' && variant.ID) {
          // Soft delete variant
          await tx.productVariant.update({
            where: {
              ID: variant.ID,
              ProductId: productId
            },
            data: {
              Deleted: true,
              UpdatedDate: new Date()
            }
          });
        }
      }
    }

    // Return updated product with all relations
    return await tx.products.findUnique({
      where: { ID: productId },
      include: {
        Categories: true,
        Suppliers: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true
              }
            }
          }
        },
        Customer: {
          include: {
            Users: {
              select: {
                Id: true,
                Name: true,
                Email: true
              }
            }
          }
        },
        Images: {
          where: { Deleted: false }
        },
        ProductAttribute: {
          where: { Deleted: false }
        },
        ProductVariant: {
          where: { Deleted: false }
        }
      }
    });
  });

  return product;
};

/**
 * Delete product (soft delete)
 */
export const deleteProductService = async (productId) => {
  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId, Deleted: false }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Soft delete product and related data
  await prisma.$transaction(async (tx) => {
    // Delete product
    await tx.products.update({
      where: { ID: productId },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      }
    });

    // Delete related images
    await tx.images.updateMany({
      where: { ProductId: productId },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      }
    });

    // Delete related attributes
    await tx.productAttribute.updateMany({
      where: { ProductId: productId },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      }
    });

    // Delete related variants
    await tx.productVariant.updateMany({
      where: { ProductId: productId },
      data: {
        Deleted: true,
        UpdatedDate: new Date()
      }
    });
  });

  return true;
};

/**
 * Upload product images
 */
export const uploadProductImagesService = async (productId, imageUrls) => {
  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId, Deleted: false }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Create image records
  const images = await prisma.images.createMany({
    data: imageUrls.map(url => ({
      Url: url,
      ProductId: productId,
      Deleted: false,
      CreatedDate: new Date()
    }))
  });

  // Return the created image URLs
  return imageUrls;
};

/**
 * Delete specific product image by URL
 */
export const deleteProductImageByUrlService = async (productId, imageUrl) => {
  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId, Deleted: false }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Check if image exists and belongs to the product using URL
  const existingImage = await prisma.images.findFirst({
    where: {
      Url: imageUrl,
      ProductId: productId,
      Deleted: false
    }
  });

  if (!existingImage) {
    throw new Error('Image not found or does not belong to this product');
  }

  // Soft delete the image in database
  const deletedImage = await prisma.images.update({
    where: { ID: existingImage.ID },
    data: {
      Deleted: true,
      UpdatedDate: new Date()
    }
  });

  return {
    imageId: deletedImage.ID,
    imageUrl: deletedImage.Url,
    productId: deletedImage.ProductId
  };
};

/**
 * Delete specific product image by database ID (legacy function - kept for backward compatibility)
 */
export const deleteProductImageService = async (productId, imageId) => {
  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId, Deleted: false }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Check if image exists and belongs to the product
  const existingImage = await prisma.images.findFirst({
    where: {
      ID: imageId,
      ProductId: productId,
      Deleted: false
    }
  });

  if (!existingImage) {
    throw new Error('Image not found or does not belong to this product');
  }

  // Soft delete the image in database
  const deletedImage = await prisma.images.update({
    where: { ID: imageId },
    data: {
      Deleted: true,
      UpdatedDate: new Date()
    }
  });

  return {
    imageId: deletedImage.ID,
    imageUrl: deletedImage.Url,
    productId: deletedImage.ProductId
  };
};

/**
 * Update product status (active/inactive)
 */
export const updateProductStatusService = async (productId, status) => {
  // Check if product exists
  const existingProduct = await prisma.products.findUnique({
    where: { ID: productId }
  });

  if (!existingProduct) {
    throw new Error('Product not found');
  }

  // Map status to Deleted field
  const isDeleted = status === 'inactive';

  // Check if product is already in the requested status
  if (existingProduct.Deleted === isDeleted) {
    throw new Error(`Product is already ${status}`);
  }

  // Update product status
  const updatedProduct = await prisma.products.update({
    where: { ID: productId },
    data: {
      Deleted: isDeleted,
      UpdatedDate: new Date()
    },
    include: {
      Images: {
        where: { Deleted: false },
        select: { Url: true }
      },
      ProductAttribute: {
        where: { Deleted: false },
        select: { ID: true, Key: true, Value: true }
      },
      ProductVariant: {
        where: { Deleted: false },
        select: { ID: true, Name: true, Type: true, CustomPrice: true, Stock: true }
      },
      Categories: {
        select: { ID: true, Name: true, Description: true }
      },
      Suppliers: {
        include: {
          Users: {
            select: { Name: true, Email: true, PhoneNumber: true }
          }
        }
      },
      Customer: {
        include: {
          Users: {
            select: { Name: true, Email: true }
          }
        }
      },
      Reviews: {
        where: { Deleted: false },
        include: {
          Customer: {
            include: {
              Users: {
                select: { Name: true }
              }
            }
          }
        }
      }
    }
  });

  return updatedProduct;
};
