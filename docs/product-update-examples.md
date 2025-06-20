# Product Update API Examples

## Overview
The product update API now supports updating attributes and variants along with basic product information.

## Update Product with Attributes and Variants

### Endpoint
```
PUT /api/products/:id
```

### Request Body Structure

#### Basic Product Update
```json
{
  "Name": "Updated Product Name",
  "Description": "Updated description",
  "Price": 29.99,
  "Stock": 100,
  "MinimumStock": 10,
  "CategoryId": 2,
  "SupplierId": "supplier-guid-here",
  "CustomerId": "customer-guid-here"
}
```

#### Update with Attributes
```json
{
  "Name": "Updated Product Name",
  "Price": 29.99,
  "Attributes": [
    {
      "_action": "create",
      "Key": "Color",
      "Value": "Blue"
    },
    {
      "_action": "update",
      "ID": 123,
      "Key": "Size",
      "Value": "Large"
    },
    {
      "_action": "delete",
      "ID": 124
    }
  ]
}
```

#### Update with Variants
```json
{
  "Name": "Updated Product Name",
  "Price": 29.99,
  "Variants": [
    {
      "_action": "create",
      "Name": "Small Size",
      "Type": "Size",
      "CustomPrice": 25.99,
      "Stock": 50
    },
    {
      "_action": "update",
      "ID": 456,
      "Name": "Medium Size",
      "Type": "Size",
      "CustomPrice": 29.99,
      "Stock": 75
    },
    {
      "_action": "delete",
      "ID": 457
    }
  ]
}
```

#### Complete Update Example
```json
{
  "Name": "Premium T-Shirt",
  "Description": "High-quality cotton t-shirt",
  "Price": 39.99,
  "Stock": 200,
  "MinimumStock": 20,
  "CategoryId": 1,
  "Attributes": [
    {
      "_action": "create",
      "Key": "Material",
      "Value": "100% Cotton"
    },
    {
      "_action": "update",
      "ID": 100,
      "Key": "Brand",
      "Value": "Premium Brand"
    }
  ],
  "Variants": [
    {
      "_action": "create",
      "Name": "Small",
      "Type": "Size",
      "CustomPrice": 35.99,
      "Stock": 50
    },
    {
      "_action": "create",
      "Name": "Medium",
      "Type": "Size",
      "CustomPrice": 39.99,
      "Stock": 75
    },
    {
      "_action": "update",
      "ID": 200,
      "Name": "Large",
      "Type": "Size",
      "CustomPrice": 42.99,
      "Stock": 60
    }
  ]
}
```

## Action Types

### For Attributes and Variants:
- **`create`**: Creates a new attribute/variant (ID not required)
- **`update`**: Updates existing attribute/variant (ID required)
- **`delete`**: Soft deletes attribute/variant (ID required)

### Notes:
1. If `_action` is not specified, it defaults to `create`
2. For `update` and `delete` actions, the `ID` field is required
3. For `create` action, the `ID` field is ignored if provided
4. All operations are performed within a database transaction
5. If any operation fails, the entire update is rolled back

## Response Format
The API returns the updated product with all related data:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 123,
    "name": "Premium T-Shirt",
    "description": "High-quality cotton t-shirt",
    "price": 39.99,
    "stock": 200,
    "minimumStock": 20,
    "sku": "generated-sku",
    "categoryId": 1,
    "supplierId": null,
    "customerId": null,
    "image": "first-image-url",
    "images": ["image-url-1", "image-url-2"],
    "category": {
      "id": 1,
      "name": "Clothing",
      "description": "Clothing items"
    },
    "supplier": null,
    "customer": null,
    "attributes": [
      {
        "id": 100,
        "key": "Brand",
        "value": "Premium Brand"
      },
      {
        "id": 101,
        "key": "Material",
        "value": "100% Cotton"
      }
    ],
    "variants": [
      {
        "id": 200,
        "name": "Large",
        "type": "Size",
        "price": 42.99,
        "stock": 60
      },
      {
        "id": 201,
        "name": "Small",
        "type": "Size",
        "price": 35.99,
        "stock": 50
      }
    ],
    "reviews": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

## Delete Specific Product Image

### Endpoint
```
DELETE /api/products/:productId/images/:imageId
```

### Parameters
- `productId` (number, required): The ID of the product
- `imageId` (number, required): The ID of the image to delete

### Example Request
```
DELETE /api/products/123/images/456
```

### Response Format
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "imageId": 456,
    "productId": 123,
    "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/products/product_123_1234567890_0.jpg",
    "cloudinaryDeleted": true,
    "cloudinaryPublicId": "products/product_123_1234567890_0"
  }
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Product not found"
}
```

```json
{
  "success": false,
  "message": "Image not found or does not belong to this product"
}
```

### Notes
1. **Soft Delete**: The image is marked as deleted in the database (not permanently removed)
2. **Cloudinary Cleanup**: The endpoint attempts to delete the image from Cloudinary as well
3. **Graceful Degradation**: If Cloudinary deletion fails, the database operation still succeeds
4. **Ownership Validation**: Ensures the image belongs to the specified product
5. **Authentication Required**: User must be authenticated to delete images
