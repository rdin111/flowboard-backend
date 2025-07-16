import { Request, Response, NextFunction } from 'express';
import { ZodObject } from 'zod';

const validate = (schema: ZodObject<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (e: any) {
            // Send back a formatted list of errors
            return res.status(400).json({
                message: 'Invalid request data',
                errors: e.flatten().fieldErrors,
            });
        }
    };

export default validate;