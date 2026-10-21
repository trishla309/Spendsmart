import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initDatabaseConnection, getMongoConnectionStatus } from "./src/server/db";
import authRouter, { seedDemoUser } from "./src/server/auth";
import budgetRouter from "./src/server/budget";
import expensesRouter from "./src/server/expenses";
import notificationsRouter from "./src/server/notifications";
import savingsRouter from "./src/server/savings";
import categoriesRouter from "./src/server/categories";
import moneyLentRouter from "./src/server/moneyLent";
import moneyToPayRouter from "./src/server/moneyToPay";
import { initCronJobs } from "./src/server/cron";
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Midldlewares
  app.use(express.json());

  // Log requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Initialize Database (MongoDB Atlas with fallback)
  await initDatabaseConnection();

  // Seed demo user
  await seedDemoUser();

  // API Routes
  app.use("/api/auth", authRouter);
  app.use("/api/budget", budgetRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/savings", savingsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/money-lent", moneyLentRouter);
  app.use("/api/money-to-pay", moneyToPayRouter);

  // Initialize Background Tasks
  initCronJobs();

  // Database Connection Status Route
  app.get("/api/db-status", (req, res) => {
    const status = getMongoConnectionStatus();
    const maskedUri = status.uri ? status.uri.replace(/:([^@]+)@/, ":****@") : "";
    res.json({
      connected: status.connected,
      uri: maskedUri,
    });
  });

  // Vite development middleware vs. static file serving in production
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SpendSmart Server is live on port ${PORT}`);
  });

  // Helper redirect: if port 5173 is visited in local development, automatically forward to port 3000
  if (process.env.NODE_ENV !== "production") {
    try {
      const redirectApp = express();
      redirectApp.use((req, res) => {
        res.redirect(`http://localhost:${PORT}${req.url}`);
      });
      const redirectServer = redirectApp.listen(5173, "0.0.0.0", () => {
        console.log(`Port 5173 helper active: forwarding requests to http://localhost:${PORT}`);
      });
      redirectServer.on("error", () => {
        // Ignore if port 5173 is already in use
      });
    } catch (e) {
      // Ignore error if binding to 5173 fails
    }
  }
}

startServer().catch((err) => {
  console.error("Fatal error starting SpendSmart server:", err);
});
