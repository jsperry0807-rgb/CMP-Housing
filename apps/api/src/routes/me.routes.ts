import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Listing } from "../models/listing.js";

export const meRouter = Router();

meRouter.use(requireAuth);

/** Every listing the signed-in user owns, in any status. */
meRouter.get("/listings", async (req, res) => {
  const user = req.user!;

  const items = await Listing.find({ owner: user._id }).sort({ updatedAt: -1 });

  res.json({
    items,
    counts: {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      active: items.filter((item) => item.status === "active").length,
    },
  });
});
