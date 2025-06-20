# Products Management API Documentation

## Overview
The Products Management API provides comprehensive endpoints for managing products in the ConnectChain Admin Panel. All endpoints require JWT Bearer Token authentication and follow the actual Prisma schema structure.

## Base URL
```
/api/products
```

## Authentication
All endpoints require a valid JWT Bearer Token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Products
**GET** `/api/products`

Retrieve a paginated list of products with advanced search, filtering, and sorting capabilities.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search in product name and SKU
- `category` (number, optional): Filter by category ID
- `supplierId` (string, optional): Filter by supplier ID (GUID format)
- `inStock` (boolean, optional): Filter products in stock (true/false)
- `sort` (string, optional): Sort field - Name, SKU, Price, Stock, CreatedDate, UpdatedDate (default: CreatedDate)
- `order` (string, optional): Sort order - asc, desc (default: desc)

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product description",
      "price": 99.99,
      "stock": 50,
      "minimumStock": 10,
      "sku": "12345678-1234-1234-1234-123456789012",
      "categoryId": 1,
      "supplierId": "supplier-guid",
      "customerId": null,
      "image": "https://example.com/image1.jpg",
      "images": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
      "category": {
        "id": 1,
        "name": "Electronics",
        "description": "Electronic products"
      },
      "supplier": {
        "id": "supplier-guid",
        "name": "Supplier Name",
        "email": "supplier@example.com",
        "phone": "+1234567890"
      },
      "customer": null,
      "attributes": [
        {
          "id": 1,
          "key": "Brand",
          "value": "Samsung"
        }
      ],
      "variants": [
        {
          "id": 1,
          "name": "Red",
          "type": "Color",
          "price": 99.99,
          "stock": 25
        }
      ],
      "reviews": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": null
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
```

### 2. Get Single Product
**GET** `/api/products/:id`

Retrieve detailed information about a specific product.

**Parameters:**
- `id` (number, required): Product ID

**Response:**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    // Same structure as above with additional reviews data
    "reviews": [
      {
        "id": 1,
        "rating": 5,
        "comment": "Great product!",
        "customerName": "John Doe",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 3. Create Product
**POST** `/api/products`

Create a new product with optional attributes and variants.

**Request Body:**
```json
{
  "Name": "New Product",
  "Description": "Product description",
  "Price": 99.99,
  "Stock": 100,
  "MinimumStock": 10,
  "CategoryId": 1,
  "SupplierId": "supplier-guid",
  "CustomerId": "customer-guid",
  "Attributes": [
    {
      "Key": "Brand",
      "Value": "Samsung"
    },
    {
      "Key": "Color",
      "Value": "Black"
    }
  ],
  "Variants": [
    {
      "Name": "Small",
      "Type": "Size",
      "CustomPrice": 89.99,
      "Stock": 50
    },
    {
      "Name": "Large",
      "Type": "Size",
      "CustomPrice": 109.99,
      "Stock": 30
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    // Product object with generated ID and SKU
  }
}
```

### 4. Update Product
**PUT** `/api/products/:id`

Update an existing product. All fields are optional.

**Parameters:**
- `id` (number, required): Product ID

**Request Body:**
```json
{
  "Name": "Updated Product Name",
  "Price": 109.99,
  "Stock": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    // Updated product object
  }
}
```

### 5. Delete Product
**DELETE** `/api/products/:id`

Soft delete a product and its related data (images, attributes, variants).

**Parameters:**
- `id` (number, required): Product ID

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

### 6. Upload Product Images
**POST** `/api/products/:id/images`

Upload multiple images for a product (max 10 files, 5MB each).

**Parameters:**
- `id` (number, required): Product ID

**Request Body:**
- Form data with `images` field containing multiple image files
- Supported formats: jpg, jpeg, png, gif, webp

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "imageUrls": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Error Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found (product/category/supplier not found)
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Data Model

The Products API uses the actual Prisma schema with the following key fields:

**Products Table:**
- `ID` (int, auto-increment, primary key)
- `Name` (string, optional)
- `Description` (string, optional)
- `Price` (decimal, required)
- `Stock` (int, optional)
- `MinimumStock` (int, default: 0)
- `SKU` (UniqueIdentifier, auto-generated)
- `CategoryId` (int, required, foreign key)
- `SupplierId` (string, optional, foreign key)
- `CustomerId` (string, optional, foreign key)
- `Deleted` (boolean)
- `CreatedDate` (DateTime)
- `UpdatedDate` (DateTime, optional)

**Related Tables:**
- `Images` - Product images
- `ProductAttribute` - Key-value attributes
- `ProductVariant` - Product variants with custom pricing
- `Categories` - Product categories
- `Suppliers` - Product suppliers
- `Customer` - Associated customers
- `Reviews` - Product reviews

## File Structure
```
src/modules/Products/
├── products.controller.js    # Request handlers and response mapping
├── products.service.js       # Business logic and database operations
├── products.routes.js        # Route definitions and middleware
├── products.validation.js    # Joi validation schemas
└── README.md                 # This documentation
```

## Usage Examples

### Search Products
```bash
GET /api/products?search=samsung&category=1&inStock=true&sort=Price&order=asc
```

### Create Product with Attributes
```bash
POST /api/products
Content-Type: application/json

{
  "Name": "Samsung Galaxy S24",
  "Description": "Latest smartphone",
  "Price": 999.99,
  "Stock": 50,
  "CategoryId": 1,
  "SupplierId": "supplier-guid",
  "Attributes": [
    {"Key": "Brand", "Value": "Samsung"},
    {"Key": "Storage", "Value": "256GB"}
  ]
}
```

### Upload Images
```bash
POST /api/products/1/images
Content-Type: multipart/form-data

images: [file1.jpg, file2.png]
```
