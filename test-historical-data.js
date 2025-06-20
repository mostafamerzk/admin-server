import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔧 Initializing Prisma client...');
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

console.log('🔗 Database URL configured:', !!process.env.DATABASE_URL);

/**
 * Test script to demonstrate the historical pricing issue in ConnectChain OrderItem table
 * This test performs the following steps:
 * 1. Find an existing order with OrderItems
 * 2. Display initial order details showing current product prices
 * 3. Update product price from the order's items
 * 4. Display order details again showing NEW price (demonstrating historical data loss)
 * 5. Cleanup by restoring original product prices
 */

async function testHistoricalDataIssue() {
  console.log('🧪 Testing Historical Pricing Issue in ConnectChain OrderItem Table');
  console.log('=' .repeat(70));

  let existingOrder = null;
  let originalPrices = new Map(); // Store original prices for cleanup

  try {
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Step 1: Find an existing order
    console.log('\n📋 Step 1: Finding an existing order with OrderItems...');

    // Find one existing order that has OrderItems with products that are not deleted
    existingOrder = await prisma.order.findFirst({
      where: {
        Deleted: false,
        OrderItem: {
          some: {
            Deleted: false,
            Products: {
              Deleted: false
            }
          }
        }
      },
      include: {
        Customer: {
          include: {
            Users: {
              select: { Name: true, Email: true }
            }
          }
        },
        Suppliers: {
          include: {
            Users: {
              select: { Name: true, Email: true }
            }
          }
        },
        OrderItem: {
          where: { Deleted: false },
          include: {
            Products: {
              select: {
                ID: true,
                Name: true,
                Price: true,
                SKU: true,
                Deleted: true
              }
            }
          }
        }
      }
    });

    if (!existingOrder || existingOrder.OrderItem.length === 0) {
      console.log('❌ No existing orders found with valid OrderItems');
      console.log('   Please ensure there are orders in the database with non-deleted products');
      return;
    }

    console.log('✅ Found existing order:');
    console.log(`   Order ID: ${existingOrder.ID}`);
    console.log(`   Customer: ${existingOrder.Customer.Users.Name} (${existingOrder.Customer.Users.Email})`);
    console.log(`   Supplier: ${existingOrder.Suppliers.Users.Name} (${existingOrder.Suppliers.Users.Email})`);
    console.log(`   Order Items: ${existingOrder.OrderItem.length} items`);

    // Store original prices for all products in the order for cleanup
    existingOrder.OrderItem.forEach(item => {
      originalPrices.set(item.Products.ID, item.Products.Price);
    });

    // Step 2: Display initial order details
    console.log('\n📊 Step 2: Displaying initial order details (BEFORE price change)...');
    await displayOrderDetails(existingOrder.ID, 'BEFORE');

    // Step 3: Update product price
    console.log('\n💰 Step 3: Updating product price...');

    // Select the first product from the order's OrderItems
    const firstOrderItem = existingOrder.OrderItem[0];
    const productToUpdate = firstOrderItem.Products;
    const originalPrice = originalPrices.get(productToUpdate.ID);
    const newPrice = parseFloat((originalPrice * 1.5).toFixed(2)); // Increase by 50%

    await prisma.products.update({
      where: { ID: productToUpdate.ID },
      data: {
        Price: newPrice,
        UpdatedDate: new Date()
      }
    });

    console.log(`✅ Product price updated:`);
    console.log(`   Product: ${productToUpdate.Name} (ID: ${productToUpdate.ID})`);
    console.log(`   From: $${originalPrice} to $${newPrice} (+50%)`);

    // Step 4: Display order details again
    console.log('\n📊 Step 4: Displaying order details (AFTER price change)...');
    console.log('🚨 ISSUE: Order will now show NEW price instead of historical price!');
    await displayOrderDetails(existingOrder.ID, 'AFTER');

    // Step 5: Cleanup
    console.log('\n🧹 Step 5: Cleaning up - restoring original product prices...');

    // Restore all original product prices
    for (const [productId, originalPrice] of originalPrices) {
      await prisma.products.update({
        where: { ID: productId },
        data: {
          Price: originalPrice,
          UpdatedDate: new Date()
        }
      });
    }

    console.log('✅ All product prices restored to original values');
    console.log(`✅ Restored ${originalPrices.size} product price(s)`);

    // Summary
    console.log('\n📋 SUMMARY OF THE HISTORICAL PRICING ISSUE:');
    console.log('=' .repeat(70));
    console.log('❌ OrderItem table lacks a UnitPrice field');
    console.log('❌ Order details always show CURRENT product price');
    console.log('❌ Historical pricing data is COMPLETELY LOST');
    console.log('❌ Orders placed months ago show today\'s prices');
    console.log('❌ Financial records become inaccurate over time');
    console.log('\n✅ SOLUTION:');
    console.log('   Add UnitPrice field to OrderItem table (like CartItem already has)');
    console.log('   Store the actual price at the time of order placement');
    console.log('   This ensures historical accuracy and proper financial records');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Emergency cleanup - restore original prices
    if (originalPrices.size > 0) {
      try {
        console.log('\n🚨 Attempting emergency price restoration...');
        for (const [productId, originalPrice] of originalPrices) {
          await prisma.products.update({
            where: { ID: productId },
            data: { Price: originalPrice, UpdatedDate: new Date() }
          });
        }
        console.log('✅ Emergency price restoration completed');
      } catch (cleanupError) {
        console.error('❌ Emergency price restoration failed:', cleanupError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Display detailed order information
 */
async function displayOrderDetails(orderId, phase) {
  const order = await prisma.order.findUnique({
    where: { ID: orderId },
    include: {
      Customer: {
        include: {
          Users: {
            select: { Name: true, Email: true }
          }
        }
      },
      Suppliers: {
        include: {
          Users: {
            select: { Name: true, Email: true }
          }
        }
      },
      OrderItem: {
        where: { Deleted: false },
        include: {
          Products: {
            select: {
              ID: true,
              Name: true,
              Price: true, // This is the CURRENT price, not historical!
              SKU: true
            }
          }
        }
      }
    }
  });

  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  console.log(`\n📋 ORDER DETAILS ${phase} PRICE CHANGE (ID: ${order.ID})`);
  console.log('-'.repeat(60));
  console.log(`Customer: ${order.Customer.Users.Name} (${order.Customer.Users.Email})`);
  console.log(`Supplier: ${order.Suppliers.Users.Name} (${order.Suppliers.Users.Email})`);
  console.log(`Order Date: ${order.CreatedDate.toISOString().split('T')[0]}`);
  console.log(`Status: ${getStatusString(order.Status)}`);
  console.log(`Stored SubTotal: $${order.SubTotal}`);
  console.log(`Delivery Fees: $${order.DeliveryFees}`);
  console.log(`Discount: $${order.Discount}`);
  
  console.log('\n📦 ORDER ITEMS:');
  let calculatedTotal = 0;
  
  order.OrderItem.forEach((item, index) => {
    const itemTotal = item.Products.Price * item.Quantity;
    calculatedTotal += itemTotal;
    
    console.log(`  ${index + 1}. ${item.Products.Name}`);
    console.log(`     SKU: ${item.Products.SKU}`);
    console.log(`     Quantity: ${item.Quantity}`);
    console.log(`     Unit Price: $${item.Products.Price} ${phase === 'AFTER' ? '🚨 (NEW price!)' : '(current price)'}`);
    console.log(`     Item Total: $${itemTotal.toFixed(2)}`);
  });

  console.log(`\n💰 PRICE COMPARISON:`);
  console.log(`   Stored SubTotal (from order creation): $${order.SubTotal}`);
  console.log(`   Calculated Total (using current prices): $${calculatedTotal.toFixed(2)}`);
  
  const difference = Math.abs(calculatedTotal - parseFloat(order.SubTotal));
  if (difference > 0.01) {
    console.log(`   🚨 MISMATCH: $${difference.toFixed(2)} difference!`);
    console.log(`   🚨 This proves the historical pricing issue!`);
  } else {
    console.log(`   ✅ Prices match (no price change yet)`);
  }
}

/**
 * Convert status number to string
 */
function getStatusString(status) {
  const statusMap = {
    0: 'pending',
    1: 'processing',
    2: 'shipped',
    3: 'delivered',
    4: 'cancelled'
  };
  return statusMap[status] || 'unknown';
}

// Run the test
testHistoricalDataIssue().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
