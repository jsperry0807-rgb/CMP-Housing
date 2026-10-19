import { Router } from "express";
import { isValidObjectId, Types } from "mongoose";
import { z } from "zod";
import { HttpError } from "../lib/http-error.js";
import { requireAuth, requireTeacher } from "../middleware/auth.js";
import { Listing } from "../models/listing.js";
import { Team, type TeamDocument } from "../models/team.js";
import { User } from "../models/user.js";

export const teamRouter = Router();

teamRouter.use(requireAuth);

const nameSchema = z.string().trim().min(2).max(60);
const logoSchema = z.string().trim().max(500);

const createSchema = z.object({
  name: nameSchema,
  logo: logoSchema.optional(),
});

const updateSchema = z.object({
  name: nameSchema.optional(),
  logo: logoSchema.optional(),
});

const assignSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  team: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .nullable(),
});

export interface MemberSummary {
  id: string;
  name: string;
  email: string;
}

function serializeMember(user: {
  _id: unknown;
  name: string;
  email: string;
}): MemberSummary {
  return { id: String(user._id), name: user.name, email: user.email };
}

function serializeTeam(team: TeamDocument, members: MemberSummary[]) {
  return {
    id: String(team._id),
    name: team.name,
    logo: team.logo,
    members,
  };
}

function requireTeamId(id: string): string {
  if (!isValidObjectId(id)) throw new HttpError(404, "Team not found");
  return id;
}

/** Staff overview: every team with its members, plus every student account. */
teamRouter.get("/", requireTeacher, async (_req, res) => {
  const [teams, students] = await Promise.all([
    Team.find().sort({ name: 1 }),
    User.find({ role: "student" }).sort({ name: 1 }),
  ]);

  const membersByTeam = new Map<string, MemberSummary[]>();
  for (const student of students) {
    if (!student.team) continue;
    const key = String(student.team);
    const list = membersByTeam.get(key) ?? [];
    list.push(serializeMember(student));
    membersByTeam.set(key, list);
  }

  res.json({
    teams: teams.map((team) =>
      serializeTeam(team, membersByTeam.get(String(team._id)) ?? []),
    ),
    students: students.map((student) => ({
      id: String(student._id),
      name: student.name,
      email: student.email,
      team: student.team ? String(student.team) : null,
    })),
  });
});

/** Create a team. */
teamRouter.post("/", requireTeacher, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  if (await Team.exists({ name: parsed.data.name })) {
    throw new HttpError(409, "A team with that name already exists");
  }

  const team = await Team.create(parsed.data);
  res.status(201).json({ team: serializeTeam(team, []) });
});

/** Assign (or unassign) a student, moving them onto a team. */
teamRouter.post("/assign", requireTeacher, async (req, res) => {
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const { userId, team } = parsed.data;

  if (team && !(await Team.exists({ _id: team }))) {
    throw new HttpError(404, "Team not found");
  }

  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "Student not found");
  if (user.role !== "student") {
    throw new HttpError(400, "Only students are assigned to teams");
  }

  user.team = team ? new Types.ObjectId(team) : undefined;
  await user.save();

  res.json({
    student: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      team: user.team ? String(user.team) : null,
    },
  });
});

/** Rename a team or change its logo. */
teamRouter.patch("/:id", requireTeacher, async (req, res) => {
  const id = requireTeamId(String(req.params.id));

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid request body", parsed.error.issues);
  }

  const changes: { name?: string; logo?: string } = {};
  if (parsed.data.name !== undefined) changes.name = parsed.data.name;
  if (parsed.data.logo !== undefined) changes.logo = parsed.data.logo;

  if (
    changes.name &&
    (await Team.exists({ name: changes.name, _id: { $ne: id } }))
  ) {
    throw new HttpError(409, "A team with that name already exists");
  }

  const team = await Team.findByIdAndUpdate(
    id,
    { $set: changes },
    { new: true },
  );
  if (!team) throw new HttpError(404, "Team not found");

  const members = await User.find({ team: team._id }).sort({ name: 1 });
  res.json({ team: serializeTeam(team, members.map(serializeMember)) });
});

/** Remove a team. Blocked while it still owns designs. */
teamRouter.delete("/:id", requireTeacher, async (req, res) => {
  const id = requireTeamId(String(req.params.id));

  if ((await Listing.countDocuments({ team: id })) > 0) {
    throw new HttpError(
      409,
      "Move or delete this team's designs before removing the team",
    );
  }

  const team = await Team.findById(id);
  if (!team) throw new HttpError(404, "Team not found");

  await User.updateMany({ team: id }, { $unset: { team: 1 } });
  await team.deleteOne();

  res.status(204).end();
});
