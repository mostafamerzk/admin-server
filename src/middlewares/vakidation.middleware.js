

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