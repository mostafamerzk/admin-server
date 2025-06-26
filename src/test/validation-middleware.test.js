import { validation } from '../middlewares/vakidation.middleware.js';
import { updateProductSchema } from '../modules/Products/products.validation.js';

/**
 * Test the validation middleware with multipart form data scenarios
 * This test simulates the exact data format sent by the frontend
 */

// Mock request object for testing
const createMockRequest = (body, files = null) => ({
  body,
  files,
  file: null
});

// Mock response and next functions
const mockResponse = {};
const mockNext = jest.fn();

describe('Validation Middleware - Product Update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should parse JSON strings and convert numeric fields correctly', () => {
    // Simulate Scenario 5: Complete Update (Text + Images + Attributes + Variants)
    const mockReq = createMockRequest({
      Name: "Complete Product Update",
      Description: "Complete product with everything",
      Price: "399.99", // String from form data
      Stock: "100", // String from form data
      CategoryId: "1", // String from form data
      SupplierId: "123e4567-e89b-12d3-a456-426614174000",
      Attributes: '[{"_action":"create","Key":"Brand","Value":"Apple"},{"_action":"create","Key":"Model","Value":"iPhone 15"}]', // JSON string
      Variants: '[{"_action":"create","Name":"128GB","Type":"Storage","CustomPrice":399.99,"Stock":50},{"_action":"create","Name":"256GB","Type":"Storage","CustomPrice":499.99,"Stock":30}]', // JSON string
      imagesToDelete: '["http://example.com/old1.jpg","http://example.com/old2.jpg"]' // JSON string
    }, [{ originalname: 'test.jpg' }]); // Simulate files

    const validationMiddleware = validation(updateProductSchema, 'body');
    
    // Execute the middleware
    validationMiddleware(mockReq, mockResponse, mockNext);

    // Check that next() was called without errors
    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));

    // Verify that the data was parsed correctly
    expect(typeof mockReq.body.Price).toBe('number');
    expect(mockReq.body.Price).toBe(399.99);
    expect(typeof mockReq.body.Stock).toBe('number');
    expect(mockReq.body.Stock).toBe(100);
    expect(typeof mockReq.body.CategoryId).toBe('number');
    expect(mockReq.body.CategoryId).toBe(1);
    expect(Array.isArray(mockReq.body.Attributes)).toBe(true);
    expect(mockReq.body.Attributes).toHaveLength(2);
    expect(Array.isArray(mockReq.body.Variants)).toBe(true);
    expect(mockReq.body.Variants).toHaveLength(2);
    expect(Array.isArray(mockReq.body.imagesToDelete)).toBe(true);
    expect(mockReq.body.imagesToDelete).toHaveLength(2);
  });

  test('Should handle empty arrays correctly', () => {
    // Simulate Scenario 1: Text-Only Update (No Images, No Attributes, No Variants)
    const mockReq = createMockRequest({
      Name: "Updated Product Name",
      Description: "Updated description",
      Price: "299.99",
      Stock: "50",
      MinimumStock: "10",
      CategoryId: "1",
      SupplierId: "123e4567-e89b-12d3-a456-426614174000",
      CustomerId: "undefined", // This should be removed
      Attributes: "[]", // Empty array as JSON string
      Variants: "[]" // Empty array as JSON string
    }, [{ originalname: 'test.jpg' }]);

    const validationMiddleware = validation(updateProductSchema, 'body');
    validationMiddleware(mockReq, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    expect(Array.isArray(mockReq.body.Attributes)).toBe(true);
    expect(mockReq.body.Attributes).toHaveLength(0);
    expect(Array.isArray(mockReq.body.Variants)).toBe(true);
    expect(mockReq.body.Variants).toHaveLength(0);
    expect(mockReq.body.CustomerId).toBeUndefined(); // Should be removed
  });

  test('Should handle invalid JSON gracefully', () => {
    const mockReq = createMockRequest({
      Name: "Test Product",
      Attributes: '{"invalid": json}', // Invalid JSON
      Variants: '[]'
    }, [{ originalname: 'test.jpg' }]);

    const validationMiddleware = validation(updateProductSchema, 'body');
    validationMiddleware(mockReq, mockResponse, mockNext);

    // Should call next with an error due to invalid JSON format
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  test('Should not process fields when no files are present', () => {
    // When no files are present, should not parse form data fields
    const mockReq = createMockRequest({
      Name: "Test Product",
      Price: "299.99", // Should remain as string
      Attributes: "[]" // Should remain as string
    }, null); // No files

    const validationMiddleware = validation(updateProductSchema, 'body');
    validationMiddleware(mockReq, mockResponse, mockNext);

    // Price should remain as string since no files were uploaded
    expect(typeof mockReq.body.Price).toBe('string');
    expect(typeof mockReq.body.Attributes).toBe('string');
  });
});

console.log('Validation middleware test file created successfully!');
console.log('To run this test, you would need to set up Jest in your project.');
console.log('The middleware should now handle the frontend data format correctly.');
