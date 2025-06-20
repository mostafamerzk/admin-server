
import { verifyToken } from '../utils/token/token.js';
import { prisma } from '../config/prismaClient.js';

export const isAuthenticated = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    // Validate Authorization Header
    if (!authorization) {
      return next(new Error('Authorization header required', { cause: 401 }));
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer' || !token) {
      return next(new Error('Invalid token format', { cause: 401 }));
    }

    // Verify and Decode Token
    const decoded = verifyToken({ token });

    if (!decoded.id) {
      return next(new Error('Invalid token', { cause: 401 }));
    }

    // Fetch User from Database
    const user = await prisma.users.findUnique({
        where: { Id: decoded.id },
      });
          if (!user) {
      return next(new Error('User not found', { cause: 404 }));
    }
    // Check Account Confirmation
    if (!user.EmailConfirmed) {
      return next(new Error('Email not activated', { cause: 400 }));
    }

    // Validate Token Freshness
    if (decoded.securityStamp !== user.SecurityStamp) {
        return next(new Error('Session expired due to security changes. Please login.', { cause: 401 }));
      }

    // // Validate if User is Banned
    // if (user.isBlocked) {
    //   return next(new Error('User is banned from the system.', { cause: 403 }));
    // }

    // Attach User and Company (if exists) to Request
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
