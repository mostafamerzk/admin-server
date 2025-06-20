/**
 * Suppliers API Test Examples
 * 
 * This file contains example requests and expected responses for testing the Suppliers API.
 * Use these examples with tools like Postman, Insomnia, or curl.
 * 
 * Note: Replace {{baseUrl}} with your actual API base URL (e.g., http://localhost:3000)
 * Note: Replace {{authToken}} with a valid JWT Bearer token
 */

// =============================================================================
// 1. GET ALL SUPPLIERS
// =============================================================================

/**
 * GET {{baseUrl}}/api/suppliers
 * Authorization: Bearer {{authToken}}
 */

// Basic request
const getAllSuppliersBasic = {
  method: 'GET',
  url: '{{baseUrl}}/api/suppliers',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// With filters and pagination
const getAllSuppliersFiltered = {
  method: 'GET',
  url: '{{baseUrl}}/api/suppliers?page=1&limit=10&status=active&verificationStatus=verified&search=tech',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// Expected Response
const getAllSuppliersResponse = {
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": {
    "suppliers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Smith",
        "email": "john@techsupplies.com",
        "phone": "+1-555-0123",
        "address": "123 Business Ave, Tech City",
        "status": "active",
        "verificationStatus": "verified",
        "categories": "Electronics",
        "contactPerson": "John Smith",
        "logo": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
};

// =============================================================================
// 2. GET SINGLE SUPPLIER
// =============================================================================

/**
 * GET {{baseUrl}}/api/suppliers/:id
 * Authorization: Bearer {{authToken}}
 */

const getSingleSupplier = {
  method: 'GET',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// Expected Response
const getSingleSupplierResponse = {
  "success": true,
  "message": "Supplier retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "email": "john@techsupplies.com",
    "phone": "+1-555-0123",
    "address": "123 Business Ave, Tech City",
    "status": "active",
    "verificationStatus": "verified",
    "categories": "Electronics",
    "contactPerson": "John Smith",
    "logo": null
  }
};

// =============================================================================
// 3. GET SUPPLIER PRODUCTS
// =============================================================================

/**
 * GET {{baseUrl}}/api/suppliers/:id/products
 * Authorization: Bearer {{authToken}}
 */

const getSupplierProducts = {
  method: 'GET',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000/products?page=1&limit=5',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// Expected Response
const getSupplierProductsResponse = {
  "success": true,
  "message": "Supplier products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Laptop Pro X",
        "sku": "550e8400-e29b-41d4-a716-446655440001",
        "category": "Electronics",
        "price": 1299.99,
        "stock": 50,
        "minimumStock": 10,
        "status": "active",
        "description": "High-performance laptop",
        "image": "https://example.com/image1.jpg",
        "images": ["https://example.com/image1.jpg"],
        "attributes": [
          {
            "id": 1,
            "name": "RAM",
            "value": "16GB"
          }
        ],
        "variants": [
          {
            "id": 1,
            "name": "Silver 16GB",
            "price": 1299.99,
            "stock": 25
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 5,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
};

// =============================================================================
// 4. CREATE SUPPLIER
// =============================================================================

/**
 * POST {{baseUrl}}/api/suppliers
 * Authorization: Bearer {{authToken}}
 * Content-Type: application/json
 */

const createSupplier = {
  method: 'POST',
  url: '{{baseUrl}}/api/suppliers',
  headers: {
    'Authorization': 'Bearer {{authToken}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "name": "New Tech Supplier",
    "email": "contact@newtech.com",
    "password": "securePassword123",
    "phone": "+1-555-0199",
    "address": "456 Innovation St, Tech Valley",
    "contactPerson": "Jane Doe",
    "categories": "Electronics"
  })
};

// Expected Response
const createSupplierResponse = {
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Jane Doe",
    "email": "contact@newtech.com",
    "phone": "+1-555-0199",
    "address": "456 Innovation St, Tech Valley",
    "status": "active",
    "verificationStatus": "pending",
    "categories": "Electronics",
    "contactPerson": "Jane Doe",
    "logo": null
  }
};

// =============================================================================
// 5. UPDATE VERIFICATION STATUS
// =============================================================================

/**
 * PUT {{baseUrl}}/api/suppliers/:id/verification-status
 * Authorization: Bearer {{authToken}}
 * Content-Type: application/json
 */

const updateVerificationStatus = {
  method: 'PUT',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000/verification-status',
  headers: {
    'Authorization': 'Bearer {{authToken}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "verificationStatus": "verified"
  })
};

// Expected Response
const updateVerificationStatusResponse = {
  "success": true,
  "message": "Supplier verification status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "verificationStatus": "verified",
    "status": "active"
  }
};

// =============================================================================
// 6. BAN SUPPLIER
// =============================================================================

/**
 * PUT {{baseUrl}}/api/suppliers/:id/ban
 * Authorization: Bearer {{authToken}}
 * Content-Type: application/json
 */

const banSupplier = {
  method: 'PUT',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000/ban',
  headers: {
    'Authorization': 'Bearer {{authToken}}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "status": "banned"
  })
};

// Expected Response
const banSupplierResponse = {
  "success": true,
  "message": "Supplier banned successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "status": "banned"
  }
};

// =============================================================================
// 7. UNBAN SUPPLIER
// =============================================================================

/**
 * PUT {{baseUrl}}/api/suppliers/:id/unban
 * Authorization: Bearer {{authToken}}
 */

const unbanSupplier = {
  method: 'PUT',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000/unban',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// Expected Response
const unbanSupplierResponse = {
  "success": true,
  "message": "Supplier unbanned successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "status": "active"
  }
};

// =============================================================================
// 8. DELETE SUPPLIER
// =============================================================================

/**
 * DELETE {{baseUrl}}/api/suppliers/:id
 * Authorization: Bearer {{authToken}}
 */

const deleteSupplier = {
  method: 'DELETE',
  url: '{{baseUrl}}/api/suppliers/550e8400-e29b-41d4-a716-446655440000',
  headers: {
    'Authorization': 'Bearer {{authToken}}'
  }
};

// Expected Response
const deleteSupplierResponse = {
  "success": true,
  "message": "Supplier deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "deleted"
  }
};

// =============================================================================
// ERROR RESPONSES
// =============================================================================

// 404 Not Found
const notFoundResponse = {
  "success": false,
  "message": "Supplier not found"
};

// 409 Conflict (Email already exists)
const conflictResponse = {
  "success": false,
  "message": "Email already exists"
};

// 400 Bad Request (Validation error)
const validationErrorResponse = {
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
};

// 401 Unauthorized
const unauthorizedResponse = {
  "success": false,
  "message": "Unauthorized access"
};

export {
  getAllSuppliersBasic,
  getAllSuppliersFiltered,
  getSingleSupplier,
  getSupplierProducts,
  createSupplier,
  updateVerificationStatus,
  banSupplier,
  unbanSupplier,
  deleteSupplier
};
