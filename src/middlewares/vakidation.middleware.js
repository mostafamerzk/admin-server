
/**
 * Parse JSON string fields and convert numeric string fields from multipart form data
 * Specifically handles Attributes, Variants, imagesToDelete fields and numeric conversions
 */
const parseFormDataFields = (data) => {
    const parsedData = { ...data };

    // Remove undefined values and convert "undefined" strings to undefined
    Object.keys(parsedData).forEach(key => {
        if (parsedData[key] === 'undefined' || parsedData[key] === undefined) {
            delete parsedData[key];
        }
    });

    // Parse JSON string fields
    const jsonFields = ['Attributes', 'Variants', 'imagesToDelete'];
    jsonFields.forEach(field => {
        if (parsedData[field] && typeof parsedData[field] === 'string') {
            try {
                parsedData[field] = JSON.parse(parsedData[field]);
            } catch (error) {
                // If parsing fails, leave as string - validation will catch invalid format
                console.warn(`Failed to parse ${field} as JSON:`, error.message);
            }
        }
    });

    // Convert numeric string fields to numbers
    const numericFields = ['Price', 'Stock', 'MinimumStock', 'CategoryId'];
    numericFields.forEach(field => {
        if (parsedData[field] && typeof parsedData[field] === 'string') {
            // Use parseFloat for Price (can have decimals), parseInt for others
            const numValue = field === 'Price' ? parseFloat(parsedData[field]) : parseInt(parsedData[field]);
            if (!isNaN(numValue)) {
                parsedData[field] = numValue;
            }
        }
    });

    return parsedData;
};

export const validation = (schema, source = 'body')=>{
    return (req,res,next)=>{
        //data
        let data;

        // Select data source based on parameter
        switch(source) {
            case 'query':
                data = req.query;
                break;
            case 'params':
                data = req.params;
                break;
            case 'body':
            default:
                data = req.body;
                break;
        }

        // Add file data if present
        if(req.file||req.files?.length){
            data = { ...data, file: req.file || req.files };
        }

        // Parse JSON string fields and convert numeric fields for multipart form data (when files are present)
        if (source === 'body' && (req.file || req.files?.length)) {
            data = parseFormDataFields(data);
        }

        const results = schema.validate(data,{abortEarly: false})
        // errors
        if (results.error){
            const messageList = results.error.details.map((obj)=>obj.message);
            return next(new Error(messageList,{cause:400}))
        }
        return next();
    }
};
    // for joi.custom(value,helper) 
    export const isValidId = (value, helpers) => {
        if (typeof value !== 'string' || value.length === 0 || value.length > 450) {
            return helpers.error('any.invalid', { message: 'invalid id' });
        }
        return value;
};