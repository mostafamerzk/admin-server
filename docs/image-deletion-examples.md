# Product Image Deletion API Examples

## Overview
The image deletion endpoint allows you to delete specific images from a product using the image URL. This performs both database soft-delete and Cloudinary cleanup.

## Endpoint Details

### Delete Product Image
```
DELETE /api/products/:productId/images
```

**Request Body Required:** Image URL to delete

## Usage Examples

### 1. Basic Image Deletion

**Request:**
```http
DELETE /api/products/220/images
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "imageUrl": "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/product_220_1703123456789_0.jpg"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "imageId": 45,
    "productId": 220,
    "imageUrl": "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/product_220_1703123456789_0.jpg",
    "cloudinaryDeleted": true,
    "cloudinaryPublicId": "products/product_220_1703123456789_0"
  }
}
```

### 2. Error Cases

**Product Not Found:**
```json
{
  "success": false,
  "message": "Product not found"
}
```

**Image Not Found:**
```json
{
  "success": false,
  "message": "Image not found or does not belong to this product"
}
```

**Invalid Parameters:**
```json
{
  "success": false,
  "message": "\"imageUrl\" is required"
}
```

**Invalid URL Format:**
```json
{
  "success": false,
  "message": "\"imageUrl\" must be a valid URL"
}
```

## How to Get Image URLs

To get the image URLs for deletion, first get the product details:

**Request:**
```http
GET /api/products/220
Authorization: Bearer your-jwt-token
```

**Response (showing images with URLs):**
```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": 220,
    "name": "Sample Product",
    "image": "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/image1.jpg",
    "images": [
      "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/image1.jpg",
      "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/image2.jpg"
    ],
    // ... other product data
  }
}
```

**Perfect!** The frontend can now use any URL from the `images` array to delete that specific image.

## Implementation Details

### What Happens When You Delete an Image:

1. **Validation**: Checks if product and image exist and belong together
2. **Database Update**: Marks the image as deleted (soft delete)
3. **Cloudinary Cleanup**: Attempts to delete the image from Cloudinary
4. **Response**: Returns deletion status and details

### Safety Features:

- **Soft Delete**: Images are marked as deleted, not permanently removed
- **Ownership Check**: Ensures image belongs to the specified product
- **Graceful Degradation**: Database operation succeeds even if Cloudinary deletion fails
- **Authentication**: Requires valid JWT token
- **Validation**: Validates all parameters before processing

### Cloudinary Integration:

The endpoint automatically:
- Extracts the public ID from the Cloudinary URL
- Calls Cloudinary's deletion API
- Reports whether Cloudinary deletion was successful
- Continues operation even if Cloudinary deletion fails

## Testing with Postman/Thunder Client

### Step 1: Get Product with Images
```
GET http://localhost:3000/api/products/220
Authorization: Bearer your-jwt-token
```

### Step 2: Copy the Image URL you want to delete
From the response, copy the full Cloudinary URL of the image you want to delete.

### Step 3: Delete Specific Image
```
DELETE http://localhost:3000/api/products/220/images
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "imageUrl": "https://res.cloudinary.com/dbgfyigqr/image/upload/v1234567890/products/image1.jpg"
}
```

### Step 4: Verify Deletion
```
GET http://localhost:3000/api/products/220
Authorization: Bearer your-jwt-token
```

The deleted image should no longer appear in the images array.

## Frontend Integration Example

```javascript
// Get product images
const product = await fetch('/api/products/220').then(r => r.json());
const imageToDelete = product.data.images[0]; // First image URL

// Delete the image
const deleteResult = await fetch('/api/products/220/images', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrl: imageToDelete
  })
});

const result = await deleteResult.json();
console.log('Deletion result:', result);
```

This approach is perfect because the frontend already has the image URLs from the product API response!
