import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Listing } from "../models/listing.js";
import { Team } from "../models/team.js";
import { User } from "../models/user.js";

export const meRouter = Router();

meRouter.use(requireAuth);

/**
 * Every design the signed-in student can manage, in any status: the whole
 * team's set (since designs are team-owned), or just their own when they have
 * not been assigned a team yet.
 */
meRouter.get("/listings", async (req, res) => {
  const user = req.user!;
  const filter = user.team
    ? { $or: [{ team: user.team }, { owner: user._id }] }
    : { owner: user._id };

  const items = await Listing.find(filter).sort({ updatedAt: -1 });

  res.json({
    items,
    counts: {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      active: items.filter((item) => item.status === "active").length,
    },
  });
});

/** The signed-in student's team, with every member, or null if unassigned. */
meRouter.get("/team", async (req, res) => {
  const user = req.user!;

  if (!user.team) {
    res.json({ team: null });
    return;
  }

  const team = await Team.findById(user.team);
  if (!team) {
    res.json({ team: null });
    return;
  }

  const members = await User.find({ team: team._id })
    .sort({ name: 1 })
    .select("name email");

  res.json({
    team: {
      id: String(team._id),
      name: team.name,
      logo: team.logo,
      members: members.map((member) => ({
        id: String(member._id),
        name: member.name,
        email: member.email,
      })),
    },
  });
});
