/**
 * Server Entry Point
 * Starts the Express server and establishes database connection
 */

const http = require("http");
const app = require("./app");
const config = require("./config");
const { connectDB, setupGracefulShutdown } = require("./config/database");
const logger = require("./utils/logger");
const { initializeSocket } = require("./realtime/socket");
const { startEmailWorker, stopEmailWorker } = require("./jobs/emailQueue");
const { startScheduler, stopScheduler } = require("./jobs/scheduler");
const { closeRedisClient } = require("./config/redis");

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to PostgreSQL via Prisma
    logger.info("Connecting to PostgreSQL via Prisma...");
    await connectDB();

    // Start HTTP + Express server
    const httpServer = http.createServer(app);
    initializeSocket(httpServer);
    startEmailWorker();
    startScheduler();

    const server = httpServer.listen(config.port, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║  SIWES Management System API Server                       ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(42)}║
║  Port:        ${String(config.port).padEnd(42)}║
║  API Version: ${config.apiVersion.padEnd(42)}║
║  URL:         http://localhost:${config.port}/api/${config.apiVersion.padEnd(
        19,
      )}║
║  Realtime:    ws://localhost:${String(config.port).padEnd(42)}║
╚════════════════════════════════════════════════════════════╝
      `);
      logger.info("Server is ready to accept connections");
    });

    // Setup graceful shutdown
    setupGracefulShutdown();
    process.on("SIGTERM", async () => {
      await stopEmailWorker();
      await stopScheduler();
      await closeRedisClient();
    });
    process.on("SIGINT", async () => {
      await stopEmailWorker();
      await stopScheduler();
      await closeRedisClient();
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.error(`Port ${config.port} is already in use`);
      } else {
        logger.error(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

    // Handle uncaught errors
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
      if (config.isProduction) {
        server.close(() => {
          process.exit(1);
        });
      }
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
