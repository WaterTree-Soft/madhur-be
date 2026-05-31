import { Router } from "express";
import { authenticate, requireAdmin } from "../../middleware/auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import usersRouter from "./users";
import feedbackRouter from "./feedback";
import bannersRouter from "./banners";
import testimonialsRouter from "./testimonials";
import settingsRouter from "./settings";
import uploadRouter from "./upload";
import statsRouter from "./stats";
import jobsRouter from "./jobs";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/orders", ordersRouter);
router.use("/users", usersRouter);
router.use("/feedback", feedbackRouter);
router.use("/banners", bannersRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/settings", settingsRouter);
router.use("/upload", uploadRouter);
router.use("/stats", statsRouter);
router.use("/jobs", jobsRouter);

export default router;
