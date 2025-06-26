import { Request, Response, NextFunction } from "express";

export const authorizeRoles = (...roles: string[]) => {
    return (req: any, res: Response, next: NextFunction): void => {
        if (!roles.includes(req.user?.role)) {
            res.status(403).json({ message: "Forbidden: insufficient role" });
            return;
        }
        next();
    };
};

export const isDoctor = (req: any, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'doctor') {
        res.status(403).json({ message: "Forbidden: requires doctor role" });
        return;
    }
    next();
};
