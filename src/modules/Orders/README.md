# Orders Management API

This module provides comprehensive order management functionality for the ConnectChain Admin Panel.

## Features

- **Order Listing**: Paginated list with search, filtering, and sorting
- **Order Details**: Complete order information with customer, supplier, and items
- **Order Creation**: Create orders with multiple items and automatic stock management
- **Status Management**: Update order status with validation and business rules

## API Endpoints

### GET /api/orders
Get all orders with pagination, search, and filtering.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search in order number, customer name, or supplier name
- `status` (number, optional): Filter by status (0=pending, 1=processing, 2=shipped, 3=delivered, 4=cancelled)
- `customerId` (string, optional): Filter by customer ID (GUID format)
- `supplierId` (string, optional): Filter by supplier ID (GUID format)
- `dateFrom` (date, optional): Filter orders from this date (ISO format)
- `dateTo` (date, optional): Filter orders until this date (ISO format)
- `sort` (string, optional): Sort field (CreatedDate, UpdatedDate, SubTotal, Status)
- `order` (string, optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": 1,
      "orderNumber": "uuid-string",
      "status": "pending",
      "statusCode": 0,
      "subTotal": 100.00,
      "deliveryFees": 10.00,
      "discount": 5.00,
      "total": 105.00,
      "notes": "Order notes",
      "paymentMethod": "cash",
      "createdDate": "2024-01-01T00:00:00.000Z",
      "updatedDate": "2024-01-01T00:00:00.000Z",
      "customer": {
        "id": "customer-uuid",
        "name": "Customer Name",
        "email": "customer@email.com",
        "phone": "+1234567890"
      },
      "supplier": {
        "id": "supplier-uuid",
        "name": "Supplier Name",
        "email": "supplier@email.com",
        "phone": "+1234567890"
      },
      "items": [
        {
          "id": 1,
          "productId": 1,
          "quantity": 2,
          "product": {
            "id": 1,
            "name": "Product Name",
            "price": 50.00,
            "sku": "product-sku"
          },
          "lineTotal": 100.00
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### GET /api/orders/:id
Get single order by ID with complete details.

**Parameters:**
- `id` (number): Order ID

**Response:**
Same as single order object from the list endpoint, but with full details including product descriptions and customer/supplier addresses.

### POST /api/orders
Create a new order with items.

**Request Body:**
```json
{
  "CustomerId": "customer-uuid",
  "SupplierId": "supplier-uuid",
  "items": [
    {
      "ProductId": 1,
      "Quantity": 2
    }
  ],
  "DeliveryFees": 10.00,
  "Discount": 5.00,
  "Notes": "Order notes",
  "PaymentMethod": "cash"
}
```

**Response:**
Returns the created order with full details.

### PUT /api/orders/:id/status
Update order status.

**Parameters:**
- `id` (number): Order ID

**Request Body:**
```json
{
  "status": 1,
  "Notes": "Status update notes"
}
```

**Status Codes:**
- 0: Pending
- 1: Processing
- 2: Shipped
- 3: Delivered
- 4: Cancelled

**Business Rules:**
- Cannot update to the same status
- Cannot update cancelled (4) or delivered (3) orders
- Stock is automatically decremented when order is created

## Database Schema

The module uses the following Prisma models:

### Order
- `ID` (int): Primary key
- `SubTotal` (decimal): Order subtotal
- `Status` (int): Order status (0-4)
- `SupplierId` (string): Supplier ID (GUID)
- `CustomerId` (string): Customer ID (GUID)
- `Deleted` (boolean): Soft delete flag
- `CreatedDate` (datetime): Creation timestamp
- `UpdatedDate` (datetime): Last update timestamp
- `DeliveryFees` (decimal): Delivery charges
- `Discount` (decimal): Applied discount
- `Notes` (string): Order notes
- `PaymentMethod` (string): Payment method
- `OrderNumber` (uniqueidentifier): Unique order number

### OrderItem
- `ID` (int): Primary key
- `ProductId` (int): Product ID
- `OrderId` (int): Order ID
- `Quantity` (int): Item quantity
- `Deleted` (boolean): Soft delete flag
- `CreatedDate` (datetime): Creation timestamp
- `UpdatedDate` (datetime): Last update timestamp

## Error Handling

The module provides comprehensive error handling for:
- Invalid customer/supplier IDs
- Product not found
- Insufficient stock
- Invalid status transitions
- Validation errors

## Authentication

All endpoints require JWT authentication via the `isAuthenticated` middleware.

## Validation

All inputs are validated using Joi schemas with proper error messages and type checking.
