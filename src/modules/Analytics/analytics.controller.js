import { prisma } from '../../config/prismaClient.js';
import { asyncHandler } from '../../utils/error handling/asyncHandler.js';

/**
 * Dashboard Analytics Controller
 * Handles all dashboard analytics endpoints
 */

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Get total users count
  const totalUsers = await prisma.users.count({
    where: {
      Customer: { isNot: null }
    }
  });

  // Get total suppliers count
  const totalSuppliers = await prisma.users.count({
    where: {
      Suppliers: { isNot: null }
    }
  });

  // Get total orders count
  const totalOrders = await prisma.order.count({
    where: {
      Deleted: false
    }
  });

  // Get total revenue
  const revenueResult = await prisma.order.aggregate({
    where: {
      Deleted: false
    },
    _sum: {
      SubTotal: true
    }
  });
  const totalRevenue = revenueResult._sum.SubTotal || 0;

  // Get pending verifications (users with unconfirmed emails)
  const pendingVerifications = await prisma.users.count({
    where: {
      EmailConfirmed: false
    }
  });

  // Get active users (users with confirmed emails)
  const activeUsers = await prisma.users.count({
    where: {
      EmailConfirmed: true,
      Customer: { isNot: null }
    }
  });

  // Calculate monthly growth based on available data
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // Since Users table doesn't have CreatedDate, we'll use Order data for growth calculations
  // Orders growth
  const ordersLastMonth = await prisma.order.count({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: lastMonth,
        lt: currentMonth
      }
    }
  });

  const ordersCurrentMonth = await prisma.order.count({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: currentMonth
      }
    }
  });

  // Revenue growth
  const revenueLastMonthResult = await prisma.order.aggregate({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: lastMonth,
        lt: currentMonth
      }
    },
    _sum: {
      SubTotal: true
    }
  });

  const revenueCurrentMonthResult = await prisma.order.aggregate({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: currentMonth
      }
    },
    _sum: {
      SubTotal: true
    }
  });

  const revenueLastMonth = revenueLastMonthResult._sum.SubTotal || 0;
  const revenueCurrentMonth = revenueCurrentMonthResult._sum.SubTotal || 0;

  // Calculate growth percentages (users growth set to 0 since we can't track user creation dates)
  const usersGrowth = 0; // Cannot calculate without CreatedDate in Users table
  const ordersGrowth = ordersLastMonth > 0 ? ((ordersCurrentMonth - ordersLastMonth) / ordersLastMonth * 100) : 0;
  const revenueGrowth = revenueLastMonth > 0 ? ((revenueCurrentMonth - revenueLastMonth) / revenueLastMonth * 100) : 0;

  res.status(200).json({
    totalUsers,
    totalSuppliers,
    totalOrders,
    totalRevenue: parseFloat(totalRevenue),
    pendingVerifications,
    activeUsers,
    monthlyGrowth: {
      users: parseFloat(usersGrowth.toFixed(1)),
      orders: parseFloat(ordersGrowth.toFixed(1)),
      revenue: parseFloat(revenueGrowth.toFixed(1))
    }
  });
});

/**
 * @desc    Get sales data
 * @route   GET /api/dashboard/sales
 * @access  Private
 */
export const getSalesData = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  // Calculate date range based on period
  const currentDate = new Date();
  let startDate, endDate;

  switch (period) {
    case 'week':
      startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = currentDate;
      break;
    case 'quarter':
      startDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
      endDate = currentDate;
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = currentDate;
      break;
    default: // month
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = currentDate;
  }

  // Get sales data for the period
  const salesData = await prisma.order.findMany({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      CreatedDate: true,
      SubTotal: true,
      ID: true
    },
    orderBy: {
      CreatedDate: 'asc'
    }
  });

  // Group data by date manually
  const groupedData = {};
  salesData.forEach(order => {
    const dateKey = order.CreatedDate.toISOString().split('T')[0];
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = {
        sales: 0,
        orders: 0
      };
    }
    groupedData[dateKey].sales += parseFloat(order.SubTotal);
    groupedData[dateKey].orders += 1;
  });

  // Format data for response
  const formattedData = Object.entries(groupedData).map(([date, data]) => ({
    date,
    sales: parseFloat(data.sales.toFixed(2)),
    orders: data.orders
  }));

  // Calculate total and growth
  const total = formattedData.reduce((sum, item) => sum + item.sales, 0);
  
  // Calculate growth compared to previous period
  const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  const previousPeriodEnd = startDate;

  const previousPeriodResult = await prisma.order.aggregate({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: previousPeriodStart,
        lt: previousPeriodEnd
      }
    },
    _sum: {
      SubTotal: true
    }
  });

  const previousTotal = parseFloat(previousPeriodResult._sum.SubTotal || 0);
  const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal * 100) : 0;

  res.status(200).json({
    period,
    data: formattedData,
    total: parseFloat(total.toFixed(2)),
    growth: parseFloat(growth.toFixed(1))
  });
});

/**
 * @desc    Get user growth data
 * @route   GET /api/dashboard/user-growth
 * @access  Private
 */
export const getUserGrowthData = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;

  // Since Users table doesn't have CreatedDate, we'll use Order data as a proxy for user activity
  // This shows new customers who made their first order in the period
  const currentDate = new Date();
  let startDate, endDate;

  switch (period) {
    case 'week':
      startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = currentDate;
      break;
    case 'quarter':
      startDate = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);
      endDate = currentDate;
      break;
    case 'year':
      startDate = new Date(currentDate.getFullYear(), 0, 1);
      endDate = currentDate;
      break;
    default: // month
      startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      endDate = currentDate;
  }

  // Get first orders for each customer in the period (proxy for new users)
  const firstOrders = await prisma.order.findMany({
    where: {
      Deleted: false,
      CreatedDate: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      CustomerId: true,
      CreatedDate: true
    },
    orderBy: {
      CreatedDate: 'asc'
    }
  });

  // Group by customer to find their first order
  const customerFirstOrders = {};
  firstOrders.forEach(order => {
    if (!customerFirstOrders[order.CustomerId]) {
      customerFirstOrders[order.CustomerId] = order.CreatedDate;
    }
  });

  // Group by date
  const groupedData = {};
  Object.values(customerFirstOrders).forEach(createdDate => {
    const dateKey = createdDate.toISOString().split('T')[0];
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = 0;
    }
    groupedData[dateKey] += 1;
  });

  // Get total customers count
  const totalCustomers = await prisma.users.count({
    where: {
      Customer: { isNot: null }
    }
  });

  // Format data for response
  const formattedData = Object.entries(groupedData).map(([date, newUsers]) => ({
    date,
    newUsers,
    totalUsers: totalCustomers // Static total since we can't track historical growth
  }));

  // Since we can't track historical user creation, growth is set to 0
  const growth = 0;

  res.status(200).json({
    period,
    data: formattedData,
    growth: parseFloat(growth.toFixed(1))
  });
});

/**
 * @desc    Get category distribution
 * @route   GET /api/dashboard/category-distribution
 * @access  Private
 */
export const getCategoryDistribution = asyncHandler(async (req, res) => {
  // Get all categories
  const categories = await prisma.categories.findMany({
    where: {
      Deleted: false
    },
    select: {
      ID: true,
      Name: true
    }
  });

  // Get total products count
  const totalProducts = await prisma.products.count({
    where: {
      Deleted: false
    }
  });

  const formattedData = [];

  // Process each category
  for (const category of categories) {
    // Get product count for this category
    const productCount = await prisma.products.count({
      where: {
        CategoryId: category.ID,
        Deleted: false
      }
    });

    // Calculate percentage
    const percentage = totalProducts > 0 ? (productCount / totalProducts * 100) : 0;

    // Get products with their prices for revenue calculation
    const categoryProducts = await prisma.products.findMany({
      where: {
        CategoryId: category.ID,
        Deleted: false
      },
      select: {
        Price: true,
        OrderItem: {
          where: {
            Order: {
              Deleted: false
            }
          },
          select: {
            Quantity: true
          }
        }
      }
    });

    // Calculate revenue
    let revenue = 0;
    categoryProducts.forEach(product => {
      product.OrderItem.forEach(orderItem => {
        revenue += parseFloat(product.Price) * orderItem.Quantity;
      });
    });

    formattedData.push({
      category: category.Name,
      count: productCount,
      percentage: parseFloat(percentage.toFixed(1)),
      revenue: parseFloat(revenue.toFixed(2))
    });
  }

  res.status(200).json(formattedData);
});
