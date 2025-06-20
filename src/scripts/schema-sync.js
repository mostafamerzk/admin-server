/**
 * This script demonstrates how to use the Prisma client after pulling new schemas
 * Run this script with: node src/scripts/schema-sync.js
 */

import { prisma } from '../config/prismaClient.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Function to list all tables in the database using Prisma's $queryRaw
 */
async function listAllTables() {
  try {
    // SQL Server specific query to list all tables
    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = DB_NAME()
    `;
    
    console.log('Available tables in the database:');
    tables.forEach(table => {
      console.log(`- ${table.TABLE_NAME}`);
    });
    
    return tables;
  } catch (error) {
    console.error('Error listing tables:', error);
    throw error;
  }
}

/**
 * Function to check if a model exists in the Prisma client
 */
function checkModelExists(modelName) {
  return modelName in prisma;
}

/**
 * Main function to demonstrate schema sync
 */
async function main() {
  console.log('Checking database schema and Prisma client synchronization...');
  
  try {
    // List all tables from the database
    const tables = await listAllTables();
    
    // Check if each table has a corresponding model in Prisma
    console.log('\nChecking if Prisma models exist for each table:');
    
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      // Convert table name to potential Prisma model name (camelCase or PascalCase)
      // This is a simplistic approach - your actual model names might differ
      const possibleModelNames = [
        tableName,                                          // Exact match
        tableName.charAt(0).toLowerCase() + tableName.slice(1), // camelCase
        tableName.charAt(0).toUpperCase() + tableName.slice(1)  // PascalCase
      ];
      
      let modelExists = false;
      for (const modelName of possibleModelNames) {
        if (checkModelExists(modelName)) {
          console.log(`✅ Table '${tableName}' has corresponding Prisma model '${modelName}'`);
          modelExists = true;
          break;
        }
      }
      
      if (!modelExists) {
        console.log(`❌ Table '${tableName}' does not have a corresponding Prisma model`);
      }
    }
    
    console.log('\nIf you see missing models, run:');
    console.log('npm run db:sync');
    console.log('This will update your Prisma schema and regenerate the client.');
    
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
