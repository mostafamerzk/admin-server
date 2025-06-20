/**
 * Orders API Test Examples
 * 
 * These are example requests for testing the Orders Management API endpoints.
 * Use these with tools like Postman, Insomnia, or curl.
 * 
 * Note: Replace the JWT token and IDs with actual values from your database.
 */

// Base URL
const BASE_URL = 'http://localhost:3000/api/orders';

// Example JWT token (replace with actual token)
const JWT_TOKEN = 'Bearer your-jwt-token-here';

// Headers for all requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': JWT_TOKEN
};

/**
 * 1. GET /api/orders - List all orders
 */
const listOrdersExamples = {
  // Basic request
  basic: {
    method: 'GET',
    url: `${BASE_URL}`,
    headers
  },

  // With pagination
  withPagination: {
    method: 'GET',
    url: `${BASE_URL}?page=1&limit=20`,
    headers
  },

  // With search
  withSearch: {
    method: 'GET',
    url: `${BASE_URL}?search=john`,
    headers
  },

  // With status filter
  withStatusFilter: {
    method: 'GET',
    url: `${BASE_URL}?status=0`, // pending orders
    headers
  },

  // With date range
  withDateRange: {
    method: 'GET',
    url: `${BASE_URL}?dateFrom=2024-01-01&dateTo=2024-12-31`,
    headers
  },

  // With customer filter
  withCustomerFilter: {
    method: 'GET',
    url: `${BASE_URL}?customerId=customer-uuid-here`,
    headers
  },

  // With sorting
  withSorting: {
    method: 'GET',
    url: `${BASE_URL}?sort=SubTotal&order=desc`,
    headers
  },

  // Complex query
  complex: {
    method: 'GET',
    url: `${BASE_URL}?page=1&limit=10&search=order&status=1&sort=CreatedDate&order=desc`,
    headers
  }
};

/**
 * 2. GET /api/orders/:id - Get single order
 */
const getOrderExample = {
  method: 'GET',
  url: `${BASE_URL}/1`, // Replace 1 with actual order ID
  headers
};

/**
 * 3. POST /api/orders - Create new order
 */
const createOrderExample = {
  method: 'POST',
  url: `${BASE_URL}`,
  headers,
  body: JSON.stringify({
    CustomerId: 'customer-uuid-here', // Replace with actual customer ID
    SupplierId: 'supplier-uuid-here', // Replace with actual supplier ID
    items: [
      {
        ProductId: 1, // Replace with actual product ID
        Quantity: 2
      },
      {
        ProductId: 2, // Replace with actual product ID
        Quantity: 1
      }
    ],
    DeliveryFees: 15.00,
    Discount: 5.00,
    Notes: 'Rush order - please process quickly',
    PaymentMethod: 'card'
  })
};

/**
 * 4. PUT /api/orders/:id/status - Update order status
 */
const updateOrderStatusExamples = {
  // Update to processing
  toProcessing: {
    method: 'PUT',
    url: `${BASE_URL}/1/status`, // Replace 1 with actual order ID
    headers,
    body: JSON.stringify({
      status: 1, // processing
      Notes: 'Order is now being processed'
    })
  },

  // Update to shipped
  toShipped: {
    method: 'PUT',
    url: `${BASE_URL}/1/status`, // Replace 1 with actual order ID
    headers,
    body: JSON.stringify({
      status: 2, // shipped
      Notes: 'Order has been shipped via FedEx. Tracking: 123456789'
    })
  },

  // Update to delivered
  toDelivered: {
    method: 'PUT',
    url: `${BASE_URL}/1/status`, // Replace 1 with actual order ID
    headers,
    body: JSON.stringify({
      status: 3, // delivered
      Notes: 'Order delivered successfully'
    })
  },

  // Cancel order
  toCancelled: {
    method: 'PUT',
    url: `${BASE_URL}/1/status`, // Replace 1 with actual order ID
    headers,
    body: JSON.stringify({
      status: 4, // cancelled
      Notes: 'Order cancelled by customer request'
    })
  }
};

/**
 * cURL Examples
 */
const curlExamples = {
  listOrders: `curl -X GET "${BASE_URL}" -H "Authorization: ${JWT_TOKEN}"`,
  
  getOrder: `curl -X GET "${BASE_URL}/1" -H "Authorization: ${JWT_TOKEN}"`,
  
  createOrder: `curl -X POST "${BASE_URL}" \\
  -H "Authorization: ${JWT_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "CustomerId": "customer-uuid-here",
    "SupplierId": "supplier-uuid-here",
    "items": [
      {
        "ProductId": 1,
        "Quantity": 2
      }
    ],
    "DeliveryFees": 10.00,
    "Discount": 0.00,
    "Notes": "Test order",
    "PaymentMethod": "cash"
  }'`,
  
  updateStatus: `curl -X PUT "${BASE_URL}/1/status" \\
  -H "Authorization: ${JWT_TOKEN}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": 1,
    "Notes": "Processing order"
  }'`
};

/**
 * Expected Response Examples
 */
const responseExamples = {
  successList: {
    success: true,
    message: "Orders retrieved successfully",
    data: [
      {
        id: 1,
        orderNumber: "550e8400-e29b-41d4-a716-446655440000",
        status: "pending",
        statusCode: 0,
        subTotal: 100.00,
        deliveryFees: 10.00,
        discount: 5.00,
        total: 105.00,
        notes: "Order notes",
        paymentMethod: "cash",
        createdDate: "2024-01-01T00:00:00.000Z",
        updatedDate: "2024-01-01T00:00:00.000Z",
        customer: {
          id: "customer-uuid",
          name: "John Doe",
          email: "john@example.com",
          phone: "+1234567890"
        },
        supplier: {
          id: "supplier-uuid",
          name: "ABC Supplier",
          email: "supplier@example.com",
          phone: "+1234567890"
        },
        items: [
          {
            id: 1,
            productId: 1,
            quantity: 2,
            product: {
              id: 1,
              name: "Product Name",
              price: 50.00,
              sku: "PROD-001"
            },
            lineTotal: 100.00
          }
        ]
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  },

  error404: {
    success: false,
    message: "Order not found"
  },

  error400: {
    success: false,
    message: "Insufficient stock for product Product Name. Available: 5, Requested: 10"
  },

  validationError: {
    success: false,
    message: "Validation error",
    errors: [
      {
        field: "CustomerId",
        message: "Customer ID is required"
      }
    ]
  }
};

// Export for use in tests
export {
  listOrdersExamples,
  getOrderExample,
  createOrderExample,
  updateOrderStatusExamples,
  curlExamples,
  responseExamples
};
