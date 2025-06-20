/**
 * This script automates the process of updating the Prisma schema from the database
 * and regenerating the Prisma client.
 *
 * Run this script with: node src/scripts/update-schema.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert exec to Promise-based
const execPromise = promisify(exec);

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the schema file
const schemaPath = path.resolve(__dirname, '../../src/config/schema.prisma');

/**
 * Executes a shell command and returns the output
 */
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) console.error(`Command stderr: ${stderr}`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    throw error;
  }
}

/**
 * Backs up the current schema file
 */
function backupSchema() {
  try {
    if (fs.existsSync(schemaPath)) {
      const backupPath = `${schemaPath}.backup-${Date.now()}`;
      fs.copyFileSync(schemaPath, backupPath);
      console.log(`Schema backup created at: ${backupPath}`);
      return backupPath;
    }
    return null;
  } catch (error) {
    console.error(`Error backing up schema: ${error.message}`);
    return null;
  }
}

/**
 * Main function to update the schema
 */
async function main() {
  console.log('Starting schema update process...');

  // Backup current schema
  const backupPath = backupSchema();

  try {
    // Pull the latest schema from the database
    console.log('\n1. Pulling latest schema from database...');
    const pullOutput = await runCommand('npx prisma db pull --schema=src/config/schema.prisma');
    console.log(pullOutput);

    // Generate the Prisma client
    console.log('\n2. Generating Prisma client...');
    const generateOutput = await runCommand('npx prisma generate --schema=src/config/schema.prisma');
    console.log(generateOutput);

    console.log('\n✅ Schema update completed successfully!');
    console.log('Your Prisma schema has been updated and the client has been regenerated.');
    console.log('You can now use any new tables or columns in your code.');

    // If everything went well and we have a backup, we can delete it
    if (backupPath) {
      console.log('\nSchema update was successful. You can delete the backup if you want.');
      console.log(`Backup location: ${backupPath}`);
    }
  } catch (error) {
    console.error('\n❌ Schema update failed:', error.message);

    // Restore from backup if available
    if (backupPath) {
      console.log('\nRestoring schema from backup...');
      fs.copyFileSync(backupPath, schemaPath);
      console.log('Schema restored from backup.');
    }
  }
}

// Run the main function
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
