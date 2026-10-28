import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import { authenticate } from "./middleware/auth.js";
import { authRouter } from "./routes/auth.routes.js";
import { productsRouter } from "./routes/products.routes.js";
import { cartRouter } from "./routes/cart.routes.js";
import { checkoutRouter } from "./routes/checkout.routes.js";
import { ordersRouter } from "./routes/orders.routes.js";
import { deliveryRouter } from "./routes/delivery.routes.js";
import { smeRouter } from "./routes/sme.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { paymentsRouter } from "./routes/payments.routes.js";
import { reviewsRouter } from "./routes/reviews.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://10.202.146.182:3000",
  "http://10.202.146.182:5000",
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global auth token parser
app.use(authenticate);

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "sokolink-backend-api",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/sme", smeRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/notifications", notificationsRouter);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found" });
});

// Central Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Backend Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SokoLink Backend API listening on http://localhost:${PORT}`);
  console.log(`🔌 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

export default app;
