import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
// import rateLimit from "express-rate-limit";
import routes from "./routes/index";

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting (commented out for local dev)
// app.use(
//   "/api/auth",
//   rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, error: "Too many requests" } })
// );
// app.use(
//   "/api",
//   rateLimit({ windowMs: 60 * 1000, max: 200, message: { success: false, error: "Too many requests" } })
// );

// API routes
app.use("/api", routes);

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: "Route not found" }));

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message ?? "Internal server error" });
});

export default app;
