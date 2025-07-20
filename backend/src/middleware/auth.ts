import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Incoming request:', req.method, req.originalUrl);
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        console.log('[AUTH] Token received:', token ? token.substring(0, 10) + '...' : 'none');
        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                console.error('[AUTH] Invalid token:', err);
                res.status(403).json({ message: "Invalid token", error: err });
                return;
            }
            req.user = user;
            console.log('[AUTH] User extracted from token:', user);
            next();
        });
    } else {
        console.error('[AUTH] Authorization header missing');
        res.status(401).json({ message: "Authorization header missing" });
    }
};
