import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import cors from "cors";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

/* ---------------- PASSWORD UTILS ---------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  if (!stored || !supplied) return false;

  // Plaintext match fallback
  if (supplied === stored) return true;

  // If stored password is not in "hash.salt" format
  if (!stored.includes(".")) return false;

  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;

    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;

    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }

    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
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
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
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
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        const ok = await comparePasswords(password, user.password || "");
        if (!ok) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (err: any) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    const id = user.id || user._id?.toString();
    done(null, id);
  });

  passport.deserializeUser(async (id: string, done) => {
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
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.login(user, (err: any) => {
        if (err) return next(err);

        // ensure session saved before responding
        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          res.json(user);
        });
      });
    })(req, res, next);
  });

  // LOGOUT
  app.post("/api/logout", (req, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.sendStatus(200);
      });
    });
  });

  // CURRENT USER
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.sendStatus(401);
    }

    res.json(req.user);
  });
}

/* ---------------- ADMIN SEED ---------------- */

export async function seedAdmin() {
  try {
    const existing = await storage.getUserByUsername("admin");
    const password = await hashPassword("admin");

    if (!existing) {
      await storage.createUser({
        username: "admin",
        password,
        role: "admin",
        language: "en",
        isActive: true,
      });
      console.log("✅ Admin user seeded (username: admin, password: admin)");
    } else {
      // Ensure password is updated to 'admin'
      const userId = existing.id || (existing as any)._id?.toString();
      await storage.updateUser(userId, { password });
      console.log("✅ Admin password reset to 'admin'");
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
}
