import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV ?? "development"}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
