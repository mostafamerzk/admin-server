import bootstrap from "./src/modules/app.controller.js";
import express from 'express';
import dotenv from 'dotenv';
import { prisma } from "./src/config/prismaClient.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Bootstrap the application
await bootstrap(app, express);

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 ConnectChain Admin Panel server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    process.exit(0);
});
