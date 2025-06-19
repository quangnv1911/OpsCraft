import { Request, Response, NextFunction } from 'express';

export const unwrapBody = (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data) {
        req.body = req.body.data;
    }
    next();
};
