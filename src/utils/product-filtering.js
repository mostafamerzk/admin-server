/**
 * Shared Product Filtering Utility
 * 
 * This utility provides consistent filtering logic for products across
 * different endpoints to ensure data consistency between categories and products.
 * 
 * Critical: This ensures that categories.productCount matches the actual
 * products that would be returned by the products endpoint with category filter.
 */

/**
 * Build the base where clause for products that should be considered "active"
 * This is the core filtering logic that must be consistent across all endpoints
 */
export const getBaseProductWhereClause = () => {
  return {
    // Deleted: false, // Only include non-deleted products
    // Add other base criteria here if needed in the future
  };
};

/**
 * Build where clause for products with additional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.search - Search term for Name and SKU
 * @param {number} filters.category - Category ID to filter by
 * @param {string} filters.supplierId - Supplier ID to filter by
 * @param {boolean} filters.inStock - Filter by stock availability
 * @param {boolean} filters.deleted - Filter by deleted status (overrides base filter)
 * @param {string} filters.status - Product status filter
 * @returns {Object} Prisma where clause
 */
export const buildProductWhereClause = (filters = {}) => {
  const { search, category, supplierId,inStock, deleted } = filters;
  
  // Start with base filtering (non-deleted products)
  const whereClause = {
    // ...getBaseProductWhereClause()
  };

  // Override deleted filter if explicitly provided
  // if (deleted !== undefined) {
  //   whereClause.Deleted = deleted;
  // }

  // Add search filter (search in Name and SKU)
  if (search && search.trim()) {
    whereClause.OR = [
      {
        Name: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      },
      {
        SKU: {
          contains: search.trim(),
          mode: 'insensitive'
        }
      }
    ];
  }
  
  // Add category filter
  if (category) {
    whereClause.CategoryId = parseInt(category);
  }
  
  // Add supplier filter
  if (supplierId) {
    whereClause.SupplierId = supplierId;
  }
  
  // Add stock filter
  if (inStock !== undefined) {
    if (inStock) {
      whereClause.Stock = {
        gte: 0
      };
    } else {
      // Products that are out of stock or have null stock
      whereClause.OR = whereClause.OR ? [
        ...whereClause.OR,
        { Stock: { lte: 0 } },
        { Stock: null }
      ] : [
        { Stock: { lte: 0 } },
        { Stock: null }
      ];
    }
  }
  
  // Add status filter (if needed for future use)
  // if (status) {
  //   switch (status) {
  //     case 'active':
  //       // Already handled by base clause (Deleted: false)
  //       break;
  //     case 'inactive':
  //       whereClause.Deleted = true;
  //       break;
  //     case 'out_of_stock':
  //       whereClause.OR = whereClause.OR ? [
  //         ...whereClause.OR,
  //         { Stock: { lte: 0 } },
  //         { Stock: null }
  //       ] : [
  //         { Stock: { lte: 0 } },
  //         { Stock: null }
  //       ];
  //       break;
  //   }
  // }
  
  return whereClause;
};

/**
 * Get the count of products for a specific category using the same filtering logic
 * This ensures consistency with the products endpoint
 * @param {Object} prisma - Prisma client instance
 * @param {number} categoryId - Category ID
 * @param {Object} additionalFilters - Additional filters to apply
 * @returns {Promise<number>} Product count
 */
export const getCategoryProductCount = async (prisma, categoryId, additionalFilters = {}) => {
  const whereClause = buildProductWhereClause({
    ...additionalFilters,
    category: categoryId
  });
  
  return await prisma.products.count({
    where: whereClause
  });
};

/**
 * Map sort field from API to database field
 * @param {string} sortField - Sort field from API
 * @returns {string} Database field name
 */
export const mapSortField = (sortField) => {
  const sortFieldMap = {
    'name': 'Name',
    'sku': 'SKU',
    'price': 'Price',
    'stock': 'Stock',
    'createdAt': 'CreatedDate',
    'updatedAt': 'UpdatedDate'
  };
  
  return sortFieldMap[sortField] || 'CreatedDate';
};

/**
 * Build order by clause for products
 * @param {string} sort - Sort field
 * @param {string} order - Sort order (asc/desc)
 * @returns {Object} Prisma orderBy clause
 */
export const buildProductOrderBy = (sort = 'createdAt', order = 'desc') => {
  const dbField = mapSortField(sort);
  return { [dbField]: order };
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
export const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
