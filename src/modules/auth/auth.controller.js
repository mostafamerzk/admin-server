import crypto from 'crypto';
import { prisma } from '../../config/prismaClient.js';
import { verifyPassword } from '../../utils/hashing/hash.js';
import { generateToken } from '../../utils/token/token.js';
import { asyncHandler } from '../../utils/error handling/asyncHandler.js';

/**
 * Authentication Controller
 * All responses use exact field names from the Users Prisma model
 */

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { Email, password } = req.body;

  // Find user by email (using exact schema field name)
  const user = await prisma.users.findFirst({
    where: {
      Email: Email,
      // EmailConfirmed: true // Only allow confirmed users to login
    },
    include: {
      UserRoles: {
        include: {
          AspNetRoles: true
        }
      },
      Customer: true,
      Suppliers: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if account is locked
  if (user.LockoutEnabled && user.LockoutEnd && new Date() < user.LockoutEnd) {
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked. Please try again later.'
    });
  }

  // Verify password
  const isPasswordValid = verifyPassword(user.PasswordHash, password);
  
  if (!isPasswordValid) {
    // Increment failed login attempts
    await prisma.users.update({
      where: { Id: user.Id },
      data: {
        AccessFailedCount: user.AccessFailedCount + 1,
        // Lock account after 5 failed attempts
        ...(user.AccessFailedCount >= 4 && {
          LockoutEnabled: true,
          LockoutEnd: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        })
      }
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid email o0r password'
    });
  }


  // Generate JWT token with user ID and security stamp
  const token = generateToken({
    payload: {
      id: user.Id,
      email: user.Email,
      securityStamp: user.SecurityStamp
    },
    options: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  });

  // Response using exact schema field names
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        Id: user.Id,
        Name: user.Name,
        Email: user.Email,
        UserName: user.UserName,
        Address: user.Address,
        BusinessType: user.BusinessType,
        PhoneNumber: user.PhoneNumber,
        PhoneNumberConfirmed: user.PhoneNumberConfirmed,
        EmailConfirmed: user.EmailConfirmed,
        TwoFactorEnabled: user.TwoFactorEnabled,
        ImageUrl: user.ImageUrl,
      },
      token
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by isAuthenticated middleware
  const userId = req.user.Id;

  // Fetch complete user data with relationships
  const user = await prisma.users.findUnique({
    where: { Id: userId },
    include: {
      UserRoles: {
        include: {
          AspNetRoles: true
        }
      },
      Customer: true,
      Suppliers: {
        include: {
          ActivityCategories: true
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Determine user type
  let userType = 'admin';
  if (user.Customer) userType = 'customer';
  if (user.Suppliers) userType = 'supplier';

  // Get user roles
  const roles = user.UserRoles.map(userRole => userRole.AspNetRoles.Name);

  // Response using exact schema field names
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      user: {
        Id: user.Id,
        Name: user.Name,
        Email: user.Email,
        UserName: user.UserName,
        Address: user.Address,
        BusinessType: user.BusinessType,
        PhoneNumber: user.PhoneNumber,
        PhoneNumberConfirmed: user.PhoneNumberConfirmed,
        EmailConfirmed: user.EmailConfirmed,
        TwoFactorEnabled: user.TwoFactorEnabled,
        LockoutEnabled: user.LockoutEnabled,
        LockoutEnd: user.LockoutEnd,
        AccessFailedCount: user.AccessFailedCount,
        ImageUrl: user.ImageUrl,
        userType,
        roles,
        // Include related data if exists
        ...(user.Customer && { customerProfile: user.Customer }),
        ...(user.Suppliers && { 
          supplierProfile: {
            ...user.Suppliers,
            activityCategory: user.Suppliers.ActivityCategories
          }
        })
      }
    }
  });
});

/**
 * @desc    Logout user (invalidate token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Update security stamp to invalidate all existing tokens
  await prisma.users.update({
    where: { Id: req.user.Id },
    data: {
      SecurityStamp: crypto.randomUUID() // Generate new security stamp
    }
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});
