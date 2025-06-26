import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                res.status(403).json({ message: "Invalid token" });
                return;
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: "Authorization header missing" });
    }
};
