import { Router, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post("/register", validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return sendError(res, "Email already registered", 409);

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      confirmed: false,
      emailVerificationToken: otp,
      emailVerificationExpiry: expiry,
    });

    try {
      await sendVerificationEmail(email, firstName, otp);
    } catch (emailErr) {
      await User.deleteOne({ _id: user._id });
      console.error("Email send failed:", emailErr);
      return sendError(res, "Could not send verification code. Please try again later.", 500);
    }

    return sendSuccess(res, { message: "Verification code sent to your email" }, undefined, 201);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    const message = err instanceof Error ? err.message : "Registration failed";
    return sendError(res, message, 500);
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
    if (!user.confirmed) return sendError(res, "Please verify your email before signing in", 403);

    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });
    const userWithoutPassword = await User.findById(user._id);

    return sendSuccess(res, { jwt, user: userWithoutPassword });
  } catch {
    return sendError(res, "Login failed", 500);
  }
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return sendError(res, "Email and OTP are required", 400);

    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpiry");
    if (!user) return sendError(res, "Account not found", 404);
    if (user.confirmed) return sendError(res, "Email already verified", 400);

    const isExpired =
      !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date();
    if (isExpired && (user.emailVerificationToken || user.emailVerificationExpiry)) {
      user.emailVerificationToken = undefined;
      user.emailVerificationExpiry = undefined;
      await user.save();
    }

    if (
      !user.emailVerificationToken ||
      isExpired ||
      user.emailVerificationToken !== String(otp)
    ) {
      return sendError(res, "Invalid or expired code", 400);
    }

    user.confirmed = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });
    const cleanUser = await User.findById(user._id);

    return sendSuccess(res, { jwt, user: cleanUser });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return sendError(res, "Verification failed", 500);
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "Email is required", 400);

    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpiry");
    if (!user || user.confirmed) {
      return sendSuccess(res, { message: "If this email exists and is unverified, a new code has been sent" });
    }

    const otp = generateOtp();
    user.emailVerificationToken = otp;
    user.emailVerificationExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.firstName, otp);
    return sendSuccess(res, { message: "Verification code resent" });
  } catch {
    return sendError(res, "Failed to resend code", 500);
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, "Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, "No account found with this email", 404);
    }
    if (user.provider === "google" && !user.password) {
      return sendError(res, "This account uses Google Sign-In. Please sign in with Google.", 400);
    }

    const otp = generateOtp();
    user.passwordResetToken = otp;
    user.passwordResetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.firstName, otp);
    } catch (emailErr) {
      console.error("Password reset email failed:", emailErr);
      return sendError(res, "Could not send reset code. Please try again later.", 500);
    }

    return sendSuccess(res, { message: "Reset code sent to your email" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return sendError(res, "Request failed", 500);
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      return sendError(res, "Email, OTP, and password are required", 400);
    }

    if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return sendError(res, "Password must be at least 8 characters with uppercase, lowercase, and a number", 400);
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetToken +passwordResetExpiry +password"
    );
    if (!user) return sendError(res, "Account not found", 404);

    const isExpired =
      !user.passwordResetExpiry || user.passwordResetExpiry < new Date();
    if (isExpired && (user.passwordResetToken || user.passwordResetExpiry)) {
      user.passwordResetToken = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
    }

    if (
      !user.passwordResetToken ||
      isExpired ||
      user.passwordResetToken !== String(otp)
    ) {
      return sendError(res, "Invalid or expired code", 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });
    const cleanUser = await User.findById(user._id);

    return sendSuccess(res, { jwt, user: cleanUser });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return sendError(res, "Reset failed", 500);
  }
});

// POST /api/auth/google
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) return sendError(res, "Missing Google credential", 400);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      return sendError(res, "Invalid Google token", 401);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const firstName = payload.given_name ?? email.split("@")[0];
    const lastName = payload.family_name ?? "";
    const avatar = payload.picture;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        provider: "google",
        googleId,
        avatar,
        confirmed: true,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.provider = "google";
      user.confirmed = true;
      if (!user.avatar && avatar) user.avatar = avatar;
      await user.save();
    }

    if (user.blocked) return sendError(res, "Account is blocked", 403);

    const jwt = signToken({ userId: String(user._id), email: user.email, role: user.role });
    const cleanUser = await User.findById(user._id);

    return sendSuccess(res, { jwt, user: cleanUser });
  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);
    return sendError(res, "Google authentication failed", 500);
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
