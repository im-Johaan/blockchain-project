import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { storage } from "../storage/metadataStorage";
import { User } from "../../../shared/types";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      address: user.address,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: "24h" }
  );
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid token format. Expected 'Bearer <token>'" });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any;
    const user = storage.getUser(decoded.username);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator privilege required" });
  }
  next();
}
