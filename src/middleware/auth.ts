import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return sendError(res, "Authentication required", 401);
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    return sendError(res, "Invalid or expired token", 401);
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      // continue without user
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return sendError(res, "Authentication required", 401);
  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return sendError(res, "Admin access required", 403);
  }
  next();
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return sendError(res, "Authentication required", 401);
  if (req.user.role !== "super_admin") {
    return sendError(res, "Super admin access required", 403);
  }
  next();
}
