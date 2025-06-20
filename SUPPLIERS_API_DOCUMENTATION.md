# Suppliers Management API Documentation

## Overview
The Suppliers Management API provides comprehensive endpoints for managing suppliers in the ConnectChain Admin Panel. All endpoints require JWT Bearer Token authentication and follow the existing database schema constraints.

## Base URL
```
/api/suppliers
```

## Authentication
All endpoints require a valid JWT Bearer Token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Database Schema Mapping

The API uses the following database field mappings:

| API Field | Database Field | Description |
|-----------|----------------|-------------|
| `id` | `Suppliers.Id` | Unique identifier (GUID) |
| `name` | `Users.Name` | Supplier/Contact person name |
| `email` | `Users.Email` | Supplier email address |
| `phone` | `Users.PhoneNumber` | Supplier phone number |
| `address` | `Users.Address` | Supplier address |
| `contactPerson` | `Users.Name` | Contact person name (same as name) |
| `logo` | `Users.ImageUrl` | Supplier logo URL |
| `status` | `Users.LockoutEnabled` | Account status (active/banned) |
| `verificationStatus` | `Users.EmailConfirmed` | Email verification status |
| `categories` | `Users.BusinessType` | Supplier business type/category |

## Status Mapping

### Supplier Status
- `active`: `LockoutEnabled = false`
- `banned`: `LockoutEnabled = true`
- `pending`: `LockoutEnabled = false` (new suppliers)

### Verification Status
- `verified`: `EmailConfirmed = true`
- `pending`: `EmailConfirmed = false`

## API Endpoints

### 1. Get All Suppliers
**GET** `/api/suppliers`

Retrieve a paginated list of suppliers with search, filtering, and sorting capabilities.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `verificationStatus` | string | No | - | Filter by verification status (`verified`, `pending`) |
| `status` | string | No | - | Filter by supplier status (`active`, `banned`) |
| `search` | string | No | - | Search in supplier name, email, contact person |

#### Request Example
```http
GET /api/suppliers?page=1&limit=20&verificationStatus=verified&status=active&search=tech
Authorization: Bearer <your-jwt-token>
```

#### Response Format
```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": {
    "suppliers": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Smith",
        "email": "contact@techsupplies.com",
        "phone": "+1-555-0123",
        "address": "123 Business Ave, Tech City, TC 12345",
        "status": "active",
        "verificationStatus": "verified",
        "categories": "Electronics",
        "contactPerson": "John Smith",
        "logo": "https://api.example.com/uploads/suppliers/logo.jpg"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 2. Get Supplier Details
**GET** `/api/suppliers/:id`

Retrieve detailed information about a specific supplier.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Request Example
```http
GET /api/suppliers/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <your-jwt-token>
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "email": "contact@techsupplies.com",
    "phone": "+1-555-0123",
    "address": "123 Business Ave, Tech City, TC 12345",
    "status": "active",
    "verificationStatus": "verified",
    "categories": "Electronics",
    "contactPerson": "John Smith",
    "logo": "https://api.example.com/uploads/suppliers/logo.jpg"
  }
}
```

### 3. Get Supplier Products
**GET** `/api/suppliers/:id/products`

Retrieve all products belonging to a specific supplier with pagination.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page |

#### Request Example
```http
GET /api/suppliers/550e8400-e29b-41d4-a716-446655440000/products?page=1&limit=10
Authorization: Bearer <your-jwt-token>
```

#### Response Format
```json
{
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
        "description": "High-performance laptop with 16GB RAM",
        "image": "https://api.example.com/uploads/products/main.jpg",
        "images": [
          "https://api.example.com/uploads/products/main.jpg",
          "https://api.example.com/uploads/products/side.jpg"
        ],
        "attributes": [
          {
            "id": 1,
            "name": "RAM",
            "value": "16GB"
          },
          {
            "id": 2,
            "name": "Storage",
            "value": "512GB SSD"
          }
        ],
        "variants": [
          {
            "id": 1,
            "name": "Silver 16GB",
            "price": 1299.99,
            "stock": 25
          },
          {
            "id": 2,
            "name": "Black 32GB",
            "price": 1599.99,
            "stock": 15
          }
        ],
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### 4. Create Supplier
**POST** `/api/suppliers`

Create a new supplier account.

#### Request Body
```json
{
  "name": "New Tech Supplier",
  "email": "contact@newtech.com",
  "phone": "+1-555-0199",
  "address": "456 Innovation St, Tech Valley, TV 67890",
  "contactPerson": "Jane Doe",
  "categories": "Electronics",
  "password": "securePassword123",
  "image": "base64_encoded_image_data"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Supplier business name |
| `email` | string | Yes | Supplier email address |
| `phone` | string | No | Supplier phone number |
| `address` | string | No | Supplier business address |
| `contactPerson` | string | Yes | Contact person name (will be stored as Name) |
| `categories` | string | No | Single category name |
| `password` | string | Yes | Account password |
| `image` | string | No | Base64 encoded logo image |

#### Request Example
```http
POST /api/suppliers
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "name": "New Tech Supplier",
  "email": "contact@newtech.com",
  "phone": "+1-555-0199",
  "address": "456 Innovation St, Tech Valley, TV 67890",
  "contactPerson": "Jane Doe",
  "categories": "Electronics",
  "password": "securePassword123",
  "image": "base64_encoded_image_data"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Jane Doe",
    "email": "contact@newtech.com",
    "phone": "+1-555-0199",
    "address": "456 Innovation St, Tech Valley, TV 67890",
    "status": "pending",
    "verificationStatus": "pending",
    "categories": "Electronics",
    "contactPerson": "Jane Doe",
    "logo": "https://api.example.com/uploads/suppliers/logo.jpg"
  }
}
```

### 5. Update Supplier Verification Status
**PUT** `/api/suppliers/:id/verification-status`

Update the verification status of a supplier.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Request Body
```json
{
  "verificationStatus": "verified"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verificationStatus` | string | Yes | New verification status (`verified`, `pending`) |

#### Request Example
```http
PUT /api/suppliers/550e8400-e29b-41d4-a716-446655440000/verification-status
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "verificationStatus": "verified"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier verification status updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "verificationStatus": "verified",
    "status": "active"
  }
}
```

### 6. Ban Supplier
**PUT** `/api/suppliers/:id/ban`

Ban a supplier account.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Request Body
```json
{
  "status": "banned"
}
```

#### Request Example
```http
PUT /api/suppliers/550e8400-e29b-41d4-a716-446655440000/ban
Content-Type: application/json
Authorization: Bearer <your-jwt-token>

{
  "status": "banned"
}
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier banned successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "status": "banned"
  }
}
```

### 7. Unban Supplier
**PUT** `/api/suppliers/:id/unban`

Unban a supplier account.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Request Example
```http
PUT /api/suppliers/550e8400-e29b-41d4-a716-446655440000/unban
Authorization: Bearer <your-jwt-token>
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier unbanned successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "status": "active"
  }
}
```

### 8. Delete Supplier
**DELETE** `/api/suppliers/:id`

Delete a supplier account (soft delete).

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Supplier ID (GUID) |

#### Request Example
```http
DELETE /api/suppliers/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <your-jwt-token>
```

#### Response Format
```json
{
  "success": true,
  "message": "Supplier deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Smith",
    "status": "deleted"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Supplier not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Implementation Notes

### Schema Compliance
✅ **All field names match the Prisma schema exactly:**
- Uses `Users.Id` for supplier identification
- Maps `contactPerson` to `Users.Name` field
- Uses `Users.LockoutEnabled` for status management
- Uses `Users.EmailConfirmed` for verification status
- Single category support via `Users.BusinessType` field

### Security Features
- JWT token authentication required for all endpoints
- Password hashing using ASP.NET Core Identity compatible hasher
- Account lockout management
- Email verification workflow

### Data Limitations
- **Single Category**: Only one category per supplier (schema limitation)
- **No Documents**: Document management not implemented (no schema support)
- **Simplified Variants**: Only basic variant fields (id, name, price, stock)
- **Simplified Attributes**: Only basic attribute fields (id, name/key, value)
- **No Join Date**: Uses proxy data or defaults for creation timestamps

### Product Data Structure
- **Images**: Multiple images supported via `Images` table
- **Variants**: Simplified to available fields only
- **Attributes**: Uses `Key` field as `name`, `Value` field as `value`
- **Categories**: Product categories from `Categories` table
- **Stock Management**: Includes current stock and minimum stock levels

## Database Relationships

```
Users (1) ←→ (1) Suppliers
Suppliers (1) ←→ (*) Products
Products (1) ←→ (*) ProductVariant
Products (1) ←→ (*) ProductAttribute
Products (1) ←→ (*) Images
Products (1) ←→ (1) Categories
```

This API design ensures full compatibility with the existing ConnectChain database schema while providing comprehensive supplier management functionality.
