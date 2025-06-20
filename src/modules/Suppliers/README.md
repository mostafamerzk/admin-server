# Suppliers Management Module

## Overview
The Suppliers Management module provides comprehensive functionality for managing suppliers in the ConnectChain Admin Panel. This module follows the existing codebase patterns and integrates seamlessly with the current database schema.

## Features

- **Supplier Listing**: Paginated list with search, filtering, and sorting
- **Supplier Details**: Complete supplier information with category and verification status
- **Product Management**: View all products belonging to a specific supplier
- **Supplier Creation**: Create new supplier accounts with validation
- **Status Management**: Update verification status and ban/unban suppliers
- **Account Management**: Delete supplier accounts

## API Endpoints

### GET /api/suppliers
Get all suppliers with pagination, search, and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search in supplier name and email
- `verificationStatus` (optional): Filter by verification status (`verified`, `pending`)
- `status` (optional): Filter by supplier status (`active`, `banned`)
- `sort` (optional): Sort field (`Name`, `Email`, `createdAt`, `updatedAt`)
- `order` (optional): Sort order (`asc`, `desc`)

### GET /api/suppliers/:id
Get detailed information about a specific supplier.

### GET /api/suppliers/:id/products
Get all products belonging to a specific supplier with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

### POST /api/suppliers
Create a new supplier account.

**Required Fields:**
- `email`: Supplier email address
- `password`: Account password
- `contactPerson`: Contact person name

**Optional Fields:**
- `name`: Business name
- `phone`: Phone number
- `address`: Business address
- `categories`: Single category name
- `image`: Base64 encoded logo image

### PUT /api/suppliers/:id/verification-status
Update the verification status of a supplier.

**Request Body:**
```json
{
  "verificationStatus": "verified" | "pending"
}
```

### PUT /api/suppliers/:id/ban
Ban a supplier account.

**Request Body:**
```json
{
  "status": "banned"
}
```

### PUT /api/suppliers/:id/unban
Unban a supplier account.

### DELETE /api/suppliers/:id
Delete a supplier account (cascade delete).

## Database Schema Integration

### Field Mappings
| API Field | Database Field | Description |
|-----------|----------------|-------------|
| `id` | `Suppliers.Id` | Unique identifier (GUID) |
| `name` | `Users.Name` | Contact person name |
| `email` | `Users.Email` | Supplier email address |
| `phone` | `Users.PhoneNumber` | Supplier phone number |
| `address` | `Users.Address` | Supplier address |
| `contactPerson` | `Users.Name` | Contact person name (same as name) |
| `logo` | `Users.ImageUrl` | Supplier logo URL |
| `status` | `Users.LockoutEnabled` | Account status (active/banned) |
| `verificationStatus` | `Users.EmailConfirmed` | Email verification status |
| `categories` | `Users.BusinessType` | Supplier business type/category |

### Status Management
- **Active**: `LockoutEnabled = false`
- **Banned**: `LockoutEnabled = true`
- **Verified**: `EmailConfirmed = true`
- **Pending**: `EmailConfirmed = false`

### Relationships
```
Users (1) ←→ (1) Suppliers
Suppliers (1) ←→ (*) Products
Products (1) ←→ (*) ProductVariant
Products (1) ←→ (*) ProductAttribute
Products (1) ←→ (*) Images
Products (1) ←→ (1) Categories
```

## Implementation Details

### Security Features
- JWT authentication required for all endpoints
- Password hashing using ASP.NET Core Identity compatible hasher
- Account lockout management
- Token invalidation on status changes

### Data Validation
- Comprehensive Joi validation schemas
- GUID format validation for IDs
- Email format validation
- Phone number pattern validation
- Input length restrictions

### Error Handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages
- Prisma error handling

### Product Data Structure
- **Simplified Variants**: Only `id`, `name`, `price`, `stock`
- **Simplified Attributes**: Only `id`, `name` (from Key), `value`
- **Multiple Images**: Full image URLs array
- **Categories**: Product categories from Categories table

## File Structure
```
src/modules/Suppliers/
├── suppliers.controller.js    # Request handlers and response mapping
├── suppliers.service.js       # Business logic and database operations
├── suppliers.routes.js        # Route definitions and middleware
├── suppliers.validation.js    # Joi validation schemas
└── README.md                  # This documentation
```

## Usage Examples

### Create Supplier
```javascript
POST /api/suppliers
{
  "email": "supplier@example.com",
  "password": "securePassword123",
  "contactPerson": "John Smith",
  "name": "Tech Supplies Inc",
  "phone": "+1-555-0123",
  "address": "123 Business Ave",
  "categories": "Electronics"
}
```

### Get Suppliers with Filters
```javascript
GET /api/suppliers?page=1&limit=20&status=active&verificationStatus=verified&search=tech
```

### Update Verification Status
```javascript
PUT /api/suppliers/550e8400-e29b-41d4-a716-446655440000/verification-status
{
  "verificationStatus": "verified"
}
```

## Testing
All endpoints can be tested using the provided validation schemas and the existing authentication system. Make sure to include a valid JWT Bearer token in the Authorization header for all requests.

## Dependencies
- Prisma ORM for database operations
- Joi for input validation
- ASP.NET Core Identity compatible password hashing
- Express.js middleware for authentication and validation
