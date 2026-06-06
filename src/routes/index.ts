import { Router } from "express";
import authRouter from "./auth";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import ordersRouter from "./orders";
import addressesRouter from "./addresses";
import cartRouter from "./cart";
import feedbackRouter from "./feedback";
import settingsRouter from "./settings";
import razorpayRouter from "./razorpay";
import testimonialsRouter from "./testimonials";
import jobsRouter from "./jobs";
import contactRouter from "./contact";
import adminRouter from "./admin/index";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/orders", ordersRouter);
router.use("/addresses", addressesRouter);
router.use("/cart", cartRouter);
router.use("/feedback", feedbackRouter);
router.use("/settings", settingsRouter);
router.use("/razorpay", razorpayRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/jobs", jobsRouter);
router.use("/contact", contactRouter);
router.use("/admin", adminRouter);

export default router;
