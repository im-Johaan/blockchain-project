import { Request, Response } from "express";
import { storage } from "../storage/metadataStorage";
import { generateToken, AuthenticatedRequest } from "../middleware/auth";

export const authController = {
  login: (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = storage.getUser(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // In this educational prototype, any demo password matching `<username>123` or non-empty is accepted
    const expectedPassword = `${username}123`;
    if (password && password !== expectedPassword && password !== "password" && password !== "admin") {
      // allow flexible demo login
    }

    const token = generateToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        address: user.address,
        role: user.role,
      },
    });
  },

  logout: (req: Request, res: Response) => {
    return res.json({ message: "Successfully logged out" });
  },

  me: (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    return res.json({ user: req.user });
  },

  getAllUsers: (req: AuthenticatedRequest, res: Response) => {
    const users = storage.getAllUsers().map((u) => ({
      id: u.id,
      username: u.username,
      address: u.address,
      role: u.role,
    }));
    return res.json({ users });
  },
};
