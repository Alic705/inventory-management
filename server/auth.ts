import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "s3cret",
    resave: false,
    saveUninitialized: false,
    store: undefined, // Memory store for now, can upgrade to Redis/DB
    cookie: {
      secure: app.get("env") === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('[auth] LocalStrategy attempt for username:', username);
        const user = await storage.getUserByUsername(username);
        if (!user) {
          console.log('[auth] LocalStrategy: user not found:', username);
          return done(null, false);
        }
        const ok = await comparePasswords(password, user.password);
        console.log('[auth] LocalStrategy: password compare result for', username, ok);
        if (!ok) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        console.log('[auth] LocalStrategy error', err);
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: User | false, info: any) => {
      console.log('[auth] POST /api/login headers.cookie:', req.headers.cookie);
      if (err) return next(err);
      if (!user) {
        console.log('[auth] login failed for user:', (req.body as any)?.username);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        console.log('[auth] login success, isAuthenticated:', req.isAuthenticated(), 'sessionID:', (req as any).sessionID, 'session:', (req as any).session);
        (req.session as any).user = {
          id: user.id,
          username: user.username,
        };
        // ensure session is saved before sending response so cookie/session persists
        (req.session as any).save?.((saveErr: any) => {
          if (saveErr) return next(saveErr);
          res.json(user);
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log('[auth] GET /api/user headers.cookie:', req.headers.cookie, 'isAuthenticated:', req.isAuthenticated(), 'sessionID:', (req as any).sessionID);
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// Helper to seed initial admin
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
    console.log("Admin account created: admin / admin123");
  }
}
