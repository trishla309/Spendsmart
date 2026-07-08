import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, Budget, Expense } from "./db";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "spendsmart_secret_key_for_jwt_tokens_123";

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

import { seedDemoDataForUser } from "./demoData";

// Seed Demo User
export async function seedDemoUser() {
  try {
    const demoEmail = "student@example.com";
    const existingUser = await User.findOne({ email: demoEmail });
    if (existingUser) {
      console.log("Demo user already exists. Skipping database seeding to preserve all data.");
      return;
    }

    console.log("No demo user found. Seeding pristine demo environment...");
    const passwordHash = await bcrypt.hash("Student@123", 10);
    const existing = await User.create({
      name: "Rahul Sharma",
      email: demoEmail,
      passwordHash,
    });
    console.log("Demo student Rahul Sharma seeded successfully (student@example.com / Student@123)");

    // Ensure the demo student has July 2026 budget and exact 41 expenses seeded
    await seedDemoDataForUser(existing._id);
  } catch (error) {
    console.error("Error seeding demo user:", error);
  }
}

// Authentication Middleware
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// Validation helpers
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  
  // Expanded special characters list
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/;
  return specialCharRegex.test(password);
}

// Sign Up Route
router.post("/signup", async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  if (!isStrongPassword(password)) {
    res.status(400).json({
      error: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.",
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: "An account with this email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "An error occurred during sign up." });
  }
});

// Login Route
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ error: "User Not Found." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid Password." });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login." });
  }
});

// Get Me Route (token verification for persistence)
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
});

// Delete user account and all associated data
router.delete("/account", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    // Delete all records linked to this user
    await Budget.deleteMany({ userId });
    await Expense.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    res.json({ message: "Account deleted successfully along with all transactions and budgets." });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "An error occurred during account deletion." });
  }
});

export default router;
