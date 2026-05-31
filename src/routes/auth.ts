import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, "Email already registered", 409);

    const user = await User.create({ name, email, password });
    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });

    return sendSuccess(res, { jwt, user }, undefined, 201);
  } catch (err) {
    return sendError(res, "Registration failed", 500);
  }
});

// POST /api/auth/login
router.post("/login", validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, "Invalid email or password", 401);
    }
    if (user.blocked) return sendError(res, "Account is blocked", 403);

    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });
    const userWithoutPassword = await User.findById(user._id);

    return sendSuccess(res, { jwt, user: userWithoutPassword });
  } catch {
    return sendError(res, "Login failed", 500);
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, "Failed to fetch user", 500);
  }
});

export default router;
