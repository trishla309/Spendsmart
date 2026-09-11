import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "./auth";
import { User, Budget, DEFAULT_CATEGORIES, getUserCategories, IUserCategory } from "./db";
import { NotificationQueueManager } from "./notificationQueue";

const router = Router();

// GET /api/categories - Get user's active categories
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findOne({ _id: userId });
    const activeCategories = await getUserCategories(userId);
    const hidden = (user as any)?.hiddenCategories || [];

    res.json({
      categories: activeCategories,
      hiddenCategories: hidden,
      defaultCategories: DEFAULT_CATEGORIES,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// POST /api/categories - Add a custom category or restore a hidden one
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { label, emoji, color, initialBudget, month } = req.body;

  if (!label || !label.trim()) {
    res.status(400).json({ error: "Category name is required." });
    return;
  }

  const cleanLabel = label.trim();
  let keySlug = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (!keySlug) {
    keySlug = `cat_${Date.now()}`;
  }

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let existingCats: IUserCategory[] = Array.isArray((user as any).categories) && (user as any).categories.length > 0
      ? [...(user as any).categories]
      : [...DEFAULT_CATEGORIES];

    let hidden = Array.isArray((user as any).hiddenCategories) ? [...(user as any).hiddenCategories] : [];

    // If key already exists in active categories, make it unique
    if (existingCats.some((c) => c.key === keySlug && !hidden.includes(c.key))) {
      keySlug = `${keySlug}_${Math.random().toString(36).substring(2, 6)}`;
    }

    // Unhide if was hidden
    hidden = hidden.filter((k) => k !== keySlug);

    const newCategory: IUserCategory = {
      key: keySlug,
      label: cleanLabel,
      emoji: emoji || "🏷️",
      color: color || "bg-violet-500",
      isDefault: false,
    };

    // Replace if exists in user.categories (e.g. unhiding/redefining), else append
    const existingIdx = existingCats.findIndex((c) => c.key === keySlug);
    if (existingIdx >= 0) {
      existingCats[existingIdx] = newCategory;
    } else {
      existingCats.push(newCategory);
    }

    await User.updateOne(
      { _id: userId },
      {
        categories: existingCats,
        hiddenCategories: hidden,
      } as any
    );

    // If initial budget allocated, add to current month's budget
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const targetMonth = month || currentMonthStr;

    if (initialBudget && Number(initialBudget) > 0) {
      const budget = await Budget.findOne({ userId, month: targetMonth });
      if (budget) {
        const allocated = { ...(budget.allocated || {}) };
        allocated[keySlug] = Number(initialBudget);
        await Budget.updateOne({ _id: budget._id }, { allocated });
      }
    }

    NotificationQueueManager.enqueueNotification(
      userId,
      "success",
      "Category Added",
      `New category "${cleanLabel}" has been added to your budget workspace.`
    );

    const updatedActive = await getUserCategories(userId);

    res.status(201).json({
      message: "Category added successfully",
      category: newCategory,
      categories: updatedActive,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// DELETE /api/categories/:key - Remove a category (default or custom)
router.delete("/:key", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const categoryKey = req.params.key;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!categoryKey) {
    res.status(400).json({ error: "Category key is required" });
    return;
  }

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let existingCats: IUserCategory[] = Array.isArray((user as any).categories) && (user as any).categories.length > 0
      ? [...(user as any).categories]
      : [...DEFAULT_CATEGORIES];

    let hidden = Array.isArray((user as any).hiddenCategories) ? [...(user as any).hiddenCategories] : [];

    // Add to hidden if not already there
    if (!hidden.includes(categoryKey)) {
      hidden.push(categoryKey);
    }

    // Filter out from existing categories list if custom
    existingCats = existingCats.filter((c) => c.key !== categoryKey);

    await User.updateOne(
      { _id: userId },
      {
        categories: existingCats,
        hiddenCategories: hidden,
      } as any
    );

    NotificationQueueManager.enqueueNotification(
      userId,
      "info",
      "Category Removed",
      `Category "${categoryKey}" was removed from your active cards.`
    );

    const updatedActive = await getUserCategories(userId);

    res.json({
      message: "Category removed successfully",
      removedKey: categoryKey,
      categories: updatedActive,
    });
  } catch (error) {
    console.error("Error removing category:", error);
    res.status(500).json({ error: "Failed to remove category" });
  }
});

// POST /api/categories/reset - Reset categories to system defaults
router.post("/reset", authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    await User.updateOne(
      { _id: userId },
      {
        categories: DEFAULT_CATEGORIES,
        hiddenCategories: [],
      } as any
    );

    res.json({
      message: "Categories reset to defaults successfully",
      categories: DEFAULT_CATEGORIES,
    });
  } catch (error) {
    console.error("Error resetting categories:", error);
    res.status(500).json({ error: "Failed to reset categories" });
  }
});

export default router;
