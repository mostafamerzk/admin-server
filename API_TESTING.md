# ConnectChain Admin Panel API Testing Guide

## Authentication Endpoints

The authentication system has been implemented with full compliance to the Prisma schema. All field names match exactly with the database schema.

### Base URL
```
http://localhost:3000/api
```

### 1. Login Endpoint

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "Email": "admin@connectchain.com",
  "password": "yourpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "Id": "user-id-string",
      "Name": "Admin User",
      "Email": "admin@connectchain.com",
      "UserName": "admin",
      "Address": "Admin Address",
      "BusinessType": "Administration",
      "PhoneNumber": "+1234567890",
      "PhoneNumberConfirmed": true,
      "EmailConfirmed": true,
      "TwoFactorEnabled": false,
      "ImageUrl": "https://example.com/avatar.jpg",
      "userType": "admin",
      "roles": ["Admin"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### 2. Get Current User Profile

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "Id": "user-id-string",
      "Name": "Admin User",
      "Email": "admin@connectchain.com",
      "UserName": "admin",
      "Address": "Admin Address",
      "BusinessType": "Administration",
      "PhoneNumber": "+1234567890",
      "PhoneNumberConfirmed": true,
      "EmailConfirmed": true,
      "TwoFactorEnabled": false,
      "LockoutEnabled": false,
      "LockoutEnd": null,
      "AccessFailedCount": 0,
      "ImageUrl": "https://example.com/avatar.jpg",
      "userType": "admin",
      "roles": ["Admin"]
    }
  }
}
```

### 3. Logout

**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@connectchain.com",
    "password": "yourpassword"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Schema Compliance Notes

✅ **All field names match the Prisma Users model exactly:**
- `Id` (not `id`)
- `Name` (not `name`)
- `Email` (not `email`)
- `UserName` (not `username`)
- `PhoneNumber` (not `phoneNumber`)
- `EmailConfirmed` (not `emailConfirmed`)
- `PhoneNumberConfirmed` (not `phoneNumberConfirmed`)
- `TwoFactorEnabled` (not `twoFactorEnabled`)
- `LockoutEnabled` (not `lockoutEnabled`)
- `LockoutEnd` (not `lockoutEnd`)
- `AccessFailedCount` (not `accessFailedCount`)
- `ImageUrl` (not `imageUrl`)

✅ **Security Features Implemented:**
- JWT token with SecurityStamp validation
- Account lockout after 5 failed attempts
- Email confirmation requirement
- Password hashing with bcrypt
- Token invalidation on logout

✅ **User Type Detection:**
- Automatically detects if user is Customer, Supplier, or Admin
- Includes role information from AspNetRoles
- Includes related profile data when available

## Next Steps

The authentication system is now fully functional and ready for integration with:
1. Customer management endpoints
2. Supplier management endpoints  
3. Order management endpoints
4. Category management endpoints
5. Dashboard analytics endpoints

All future endpoints will follow the same schema-compliant pattern established here.
