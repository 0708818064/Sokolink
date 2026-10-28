import { Request, Response, NextFunction } from "express";
import { verifySessionToken, SessionPayload } from "../lib/auth.js";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.sokolink_session) {
      token = req.cookies.sokolink_session;
    }

    if (!token) {
      next();
      return;
    }

    const session = await verifySessionToken(token);
    if (session) {
      req.user = session;
    }
    next();
  } catch (err) {
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: requires one of roles [${allowedRoles.join(", ")}]`,
        code: "FORBIDDEN",
      });
      return;
    }
    next();
  };
}
