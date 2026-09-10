import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import cors from "cors";
import { connectDB } from "./db"; // <-- 1. DB Connection Import

const app = express();
const httpServer = createServer(app);

/* ------------------ TYPES ------------------ */

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare global {
  namespace Express {
    interface User {
      id: string; // <-- 2. MongoDB IDs are strings, not numbers
      username: string;
      role: "admin" | "staff";
      language: "en" | "ur" | "roman";
      isActive: boolean;
      createdAt: Date | string | null;
    }
  }
}

/* ------------------ BODY PARSERS ------------------ */
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

/* ------------------ CORS ------------------ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5000",
  process.env.CLIENT_ORIGIN,
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


/* ------------------ LOGGER ------------------ */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/* ------------------ REQUEST LOGGER ------------------ */
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;
  const originalResJson = res.json.bind(res);
  res.json = (bodyJson: any) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson);
  };
  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    log(logLine);
  });
  next();
});

/* ------------------ BOOTSTRAP ------------------ */
(async () => {
  try {
    // 3. Sabse pehle DB connect karein
    await connectDB();
    log("Database connection established");

    await registerRoutes(httpServer, app);

    // API 404 fallback: ensure API routes always return JSON instead of Vite HTML
    app.all("/api/*", (req, res) => {
      res.status(404).json({ message: `API endpoint ${req.method} ${req.path} not found` });
    });

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const message = err?.message || "Internal Server Error";
      console.error(err);
      res.status(status).json({ message });
    });

    // Serve frontend
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = Number(process.env.PORT) || 5000;
    // Host ko '0.0.0.0' karna behtar hai agar external access chahiye ho
    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    log(`Failed to start server: ${error}`, "bootstrap");
    process.exit(1);
  }
})();