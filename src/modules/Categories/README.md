# Categories API Documentation

This module handles category management with image upload functionality using Cloudinary.

## Features

- ✅ Create categories with image upload
- ✅ Update categories with image replacement
- ✅ Delete categories with automatic image cleanup
- ✅ Get categories with pagination and search
- ✅ Cloudinary integration for image storage

## Endpoints

### 1. Get Categories
**GET** `/api/categories`

Get all categories with pagination, search, and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search in name and description
- `sort` (string, optional): Sort field (name, createdAt, updatedAt)
- `order` (string, optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "description": "Electronic devices and accessories",
        "status": "active",
        "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/categories/category_1.jpg",
        "productCount": 25,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 2. Get Single Category
**GET** `/api/categories/:id`

Get a single category by ID.

**Parameters:**
- `id` (number, required): Category ID

**Response:**
```json
{
  "success": true,
  "message": "Category retrieved successfully",
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "active",
    "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/categories/category_1.jpg",
    "productCount": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Create Category
**POST** `/api/categories`

Create a new category with optional image upload in a single request.

**Request Body (Form Data):**
- `name` (string, required): Category name (1-255 characters)
- `description` (string, required): Category description (max 1000 characters)
- `status` (string, optional): Category status ('active' or 'inactive', default: 'active')
- `image` (file, required*): Category image file (jpg, jpeg, png, gif, webp, max 5MB)
- `imageUrl` (string, required*): Category image URL (alternative to file upload)

*Either `image` file or `imageUrl` must be provided

**Response (with image file upload):**
```json
{
  "success": true,
  "message": "Category created successfully with image",
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "active",
    "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/categories/category_1.jpg",
    "productCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "imageUpload": {
      "originalName": "category-image.jpg",
      "size": 1024000,
      "mimeType": "image/jpeg"
    }
  }
}
```

**Response (with image URL):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 1,
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "active",
    "image": "https://example.com/category-image.jpg",
    "productCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update Category (Atomic Operation)
**PUT** `/api/categories/:id`

Update an existing category with optional image upload in a single atomic operation. This endpoint handles both data and image updates efficiently:

- **Atomic operation**: All updates (data + image) happen in a single database transaction
- **Automatic cleanup**: Old images are deleted only after successful database update
- **Rollback support**: If database update fails, newly uploaded images are automatically cleaned up
- **Backward compatible**: Can update text fields only, image only, or both together

**Parameters:**
- `id` (number, required): Category ID

**Request Body (Form Data):**
- `name` (string, optional): Category name (1-255 characters)
- `description` (string, optional): Category description (max 1000 characters)
- `status` (string, optional): Category status ('active' or 'inactive')
- `image` (file, optional): New category image file (jpg, jpeg, png, gif, webp, max 5MB)
- `imageUrl` (string, optional): Image URL (use `null` to remove existing image)

**Response (with image upload):**
```json
{
  "success": true,
  "message": "Category updated successfully with new image",
  "data": {
    "id": 1,
    "name": "Electronics Updated",
    "description": "Updated description",
    "status": "active",
    "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/categories/category_1_new.jpg",
    "productCount": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "imageUpload": {
      "originalName": "new-category-image.jpg",
      "size": 245760,
      "mimeType": "image/jpeg"
    }
  }
}
```

**Response (text-only update):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Electronics Updated",
    "description": "Updated description",
    "status": "active",
    "image": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/categories/category_1.jpg",
    "productCount": 25,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

### 5. Delete Category
**DELETE** `/api/categories/:id`

Delete a category (soft delete). The category image will be automatically deleted from Cloudinary.

**Parameters:**
- `id` (number, required): Category ID

**Response:**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

### 6. Get Category Products
**GET** `/api/categories/:id/products`

Get all products in a specific category.

**Parameters:**
- `id` (number, required): Category ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search in product name and description

**Response:**
```json
{
  "success": true,
  "message": "Category products retrieved successfully",
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## Legacy Image Endpoints (Backward Compatibility)

For backward compatibility, separate image upload/delete endpoints are still available:

### Upload Category Image (Legacy)
**POST** `/api/categories/:id/upload-image`

### Delete Category Image (Legacy)
**DELETE** `/api/categories/:id/image`

**Note**: The atomic update endpoint (PUT `/api/categories/:id`) is recommended for new implementations as it provides better performance, consistency, and error handling.

## Image Upload Specifications

- **Supported formats**: jpg, jpeg, png, gif, webp
- **Maximum file size**: 5MB per image
- **Storage**: Cloudinary cloud storage
- **Folder**: Images are stored in the `categories` folder
- **Automatic cleanup**: Old images are automatically deleted when updated or category is deleted
- **Atomic operations**: Main update endpoint ensures data consistency with proper rollback

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error codes:
- `400`: Bad Request (validation errors, file upload errors, missing image)
- `404`: Category not found
- `409`: Category name already exists
- `500`: Internal server error

**Example error response for missing image:**
```json
{
  "success": false,
  "message": "Either image file or imageUrl is required"
}
```

## Database Schema

The Categories table includes:
- `ID`: Primary key (auto-increment)
- `Name`: Category name (required)
- `Description`: Category description (required)
- `ImageUrl`: Cloudinary image URL (required)
- `Deleted`: Soft delete flag
- `CreatedDate`: Creation timestamp
- `UpdatedDate`: Last update timestamp

## Dependencies

- **Cloudinary**: For image storage and management
- **Multer**: For handling multipart/form-data file uploads
- **Prisma**: For database operations
- **Joi**: For request validation
