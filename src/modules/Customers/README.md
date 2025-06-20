# Customer Management API Documentation

## Overview
The Customer Management API provides comprehensive endpoints for managing customers in the ConnectChain Admin Panel. All endpoints require JWT Bearer Token authentication.

## Base URL
```
/api/users
```

## Authentication
All endpoints require a valid JWT Bearer Token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get All Customers (Enhanced with Search)
**GET** `/api/users`

Retrieve a paginated list of customers with advanced search, filtering, and sorting capabilities.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of items per page (max: 100) |
| `search` | string | "" | Search term to filter by name or email (case-insensitive) |
| `status` | string | - | Filter by status: "active" or "banned" |
| `sort` | string | "updatedAt" | Sort field: "Name", "Email", "createdAt", "updatedAt" |
| `order` | string | "desc" | Sort order: "asc" or "desc" |

#### Example Requests
```bash
# Get all customers (default pagination)
GET /api/users

# Search for customers by name or email
GET /api/users?search=john

# Search with pagination
GET /api/users?search=john&page=1&limit=5

# Filter active customers and search
GET /api/users?status=active&search=doe

# Sort by name ascending
GET /api/users?sort=Name&order=asc

# Complex query: search, filter, sort, and paginate
GET /api/users?search=john&status=active&sort=Email&order=asc&page=2&limit=10
```

#### Response Format
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "customer",
      "status": "active",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "address": "123 Main St",
      "businessType": "retail",
      "verificationStatus": "verified",
      "createdAt": "123e4567-e89b-12d3-a456-426614174000",
      "updatedAt": "123e4567-e89b-12d3-a456-426614174000"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 2. Get Single Customer
**GET** `/api/users/:id`

#### Response
```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "type": "customer",
    "status": "active",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "+1234567890",
    "address": "123 Main St",
    "businessType": "retail",
    "verificationStatus": "verified",
    "createdAt": "123e4567-e89b-12d3-a456-426614174000",
    "updatedAt": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 3. Create New Customer
**POST** `/api/users`

#### Request Body
```json
{
  "Name": "John Doe",
  "Email": "john@example.com",
  "password": "securepassword123",
  "PhoneNumber": "+1234567890",
  "Address": "123 Main St",
  "BusinessType": "retail",
  "verificationStatus": "pending"
}
```

### 4. Update Customer
**PUT** `/api/users/:id`

#### Request Body (all fields optional)
```json
{
  "Name": "John Updated",
  "Email": "john.updated@example.com",
  "PhoneNumber": "+1234567891",
  "Address": "456 New St",
  "BusinessType": "wholesale",
  "verificationStatus": "verified"
}
```

### 5. Delete Customer
**DELETE** `/api/users/:id`

#### Response
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### 6. Update Customer Status
**PUT** `/api/users/:id/status`

#### Request Body
```json
{
  "status": "banned"
}
```

### 7. Upload Customer Image
**POST** `/api/users/upload-image`

#### Request
- Content-Type: `multipart/form-data`
- Field name: `image`
- Supported formats: jpg, jpeg, png, gif
- Max size: 5MB

#### Response
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "imageUrl": "https://example.com/uploads/user-image.jpg"
  }
}
```

## Search Functionality Details

### Enhanced Search Features
The search functionality provides powerful filtering capabilities:

1. **Multi-field Search**: Searches across both `Name` and `Email` fields simultaneously
2. **Case-insensitive**: Search is not case-sensitive
3. **Partial Matching**: Finds partial matches within field values
4. **Combined Filtering**: Search can be combined with status filtering, sorting, and pagination

### Search Examples
```bash
# Find customers with "john" in name or email
GET /api/users?search=john

# Find customers with "gmail" in email
GET /api/users?search=gmail

# Find active customers with "doe" in name or email
GET /api/users?search=doe&status=active

# Search and sort by email
GET /api/users?search=john&sort=Email&order=asc
```

## Error Responses

### Validation Errors (400)
```json
{
  "success": false,
  "message": ["Email is required", "Name must be at least 2 characters long"]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Customer not found"
}
```

### Conflict (409)
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Authorization header required"
}
```

## Database Schema Mapping

The API uses the following database field mappings:

| API Field | Database Field | Description |
|-----------|----------------|-------------|
| `id` | `Users.Id` | Unique identifier (GUID) |
| `name` | `Users.Name` | Customer full name |
| `email` | `Users.Email` | Customer email address |
| `phone` | `Users.PhoneNumber` | Customer phone number |
| `address` | `Users.Address` | Customer address |
| `businessType` | `Users.BusinessType` | Type of business |
| `avatar` | `Users.ImageUrl` | Profile image URL |
| `status` | `Users.LockoutEnabled` | Account status (active/banned) |
| `verificationStatus` | `Users.EmailConfirmed` | Email verification status |

## Implementation Notes

1. **Password Hashing**: Uses ASP.NET Core Identity compatible password hashing
2. **Authentication**: JWT tokens with security stamp validation
3. **Validation**: Comprehensive input validation using Joi schemas
4. **Error Handling**: Consistent error response format across all endpoints
5. **Pagination**: Efficient pagination with total count and page information
6. **Search Performance**: Optimized database queries with proper indexing support
