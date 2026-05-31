import { Router, Request, Response } from "express";
import { User } from "../../models/User";
import { sendSuccess, sendError, paginationMeta } from "../../utils/response";
import { getPagination } from "../../utils/pagination";
import { requireSuperAdmin } from "../../middleware/auth";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page, pageSize, skip } = getPagination(req);
    const { role, search } = req.query;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return sendSuccess(res, users, paginationMeta(page, pageSize, total));
  } catch {
    return sendError(res, "Failed to fetch users", 500);
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, "Failed to fetch user", 500);
  }
});

// PUT /api/admin/users/:id/make-admin  — super_admin only
router.put("/:id/make-admin", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: "admin" }, { new: true });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, "Failed to update user role", 500);
  }
});

// PUT /api/admin/users/:id/revoke-admin  — super_admin only
router.put("/:id/revoke-admin", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: "user" }, { new: true });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, "Failed to revoke admin role", 500);
  }
});

// PUT /api/admin/users/:id/block  — super_admin only
router.put("/:id/block", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { blocked } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { blocked: !!blocked }, { new: true });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, user);
  } catch {
    return sendError(res, "Failed to update user", 500);
  }
});

export default router;
