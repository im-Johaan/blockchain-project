import { Router } from "express";
import { authController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);
router.get("/users", authenticate, authController.getAllUsers);

export default router;
