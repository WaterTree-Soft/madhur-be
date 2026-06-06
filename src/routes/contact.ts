import { Router, Request, Response } from "express";
import { z } from "zod";
import { sendContactFormEmail } from "../utils/email";
import { sendSuccess, sendError } from "../utils/response";
import { validate } from "../middleware/validate";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(2, "Subject is required").max(200),
  message: z.string().min(5, "Message is too short").max(5000),
});

// POST /api/contact
router.post("/", validate(contactSchema), async (req: Request, res: Response) => {
  try {
    await sendContactFormEmail(req.body);
    return sendSuccess(res, { message: "Your message has been sent. We'll get back to you soon." }, undefined, 201);
  } catch (err) {
    console.error("CONTACT FORM ERROR:", err);
    return sendError(res, "Could not send your message. Please try again later.", 500);
  }
});

export default router;
