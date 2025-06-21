// import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { globalHandler } from '../utils/error handling/globalHandler.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/error handling/asyncHandler.js';
// import { schema } from '../graphQL/Schema.js';

// Import route modules
import authRoutes from './auth/auth.routes.js';
import analyticsRoutes from './Analytics/analytics.routes.js';
import customerRoutes from './Customers/customers.routes.js';
import orderRoutes from './Orders/orders.routes.js';
import supplierRoutes from './Suppliers/suppliers.routes.js';
import productRoutes from './Products/products.routes.js';
import categoryRoutes from './Categories/categories.routes.js';

const bootstrap = async (app, express) => {
    
    // Security Middlewares
    app.use(helmet());
    app.use(cors());
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100, 
        message: "Too many requests from this IP, please try again later.",
        headers: true
    });
    app.use(limiter);
    
    // parsing json data
    app.use(express.json());

    //APIs endpoints
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', analyticsRoutes);
    app.use('/api/users', customerRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/suppliers', supplierRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);

    //handle unhandled routes/endpoints
    app.use('*', (req, res) => {
        return res.status(404).json({ message: 'Route not found' });
    });

    // global error handling 
    app.use(globalHandler);
}

export default bootstrap;
