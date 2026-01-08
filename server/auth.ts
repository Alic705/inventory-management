import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import cors from "cors";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

/* ---------------- PASSWORD UTILS ---------------- */

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/* ---------------- AUTH SETUP ---------------- */

export function setupAuth(app: Express) {
  /* ---------- CORS ---------- */
  app.use(
    cors({
      origin: "http://localhost:5173",
      credentials: true,
    }),
  );

  /* ---------- SESSION ---------- */
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // dev only
      sameSite: "lax", // 🔥 fix 401
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  /* ---------- PASSPORT ---------- */
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);

        const ok = await comparePasswords(password, user.password);
        if (!ok) return done(null, false);

        return done(null, user);
      } catch (err: any) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  /* ---------------- ROUTES ---------------- */

  // LOGIN
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      (req as any).login(user, (err: any) => {
        if (err) return next(err);

        // ensure session saved before responding
        req.session.save(() => {
          res.json(user);
        });
      });
    })(req, res, next);
  });

  // LOGOUT
  app.post("/api/logout", (req, res, next) => {
    (req as any).logout((err: any) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // CURRENT USER
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    res.json(req.user);
  });
}

/* ---------------- ADMIN SEED ---------------- */

export async function seedAdmin() {
  const existing = await storage.getUserByUsername("admin");
  if (!existing) {
    const password = await hashPassword("admin123");
    await storage.createUser({
      username: "admin",
      password,
      role: "admin",
      language: "en",
      isActive: true,
    });
  }
}
