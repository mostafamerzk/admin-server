import cloudinary from '../config/cloudinary.js';

/**
 * Test Cloudinary Configuration
 * This utility function tests if Cloudinary is properly configured
 */
export const testCloudinaryConnection = async () => {
  try {
    // Test the connection by getting account details
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Cloudinary connection failed:', error.message);
    return false;
  }
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCloudinaryConnection();
}
