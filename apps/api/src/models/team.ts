import { model, Schema, type HydratedDocument, type Model } from "mongoose";

/**
 * A student team. Membership lives on the user (`User.team`), so a team is just
 * an identity: the name and logo every design it submits is credited to.
 */
export interface ITeam {
  name: string;
  /** Public URL of the team's logo. */
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

type TeamModel = Model<ITeam>;

const teamSchema = new Schema<ITeam, TeamModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
      unique: true,
    },
    logo: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
);

export const Team = model<ITeam, TeamModel>("Team", teamSchema);

export type TeamDocument = HydratedDocument<ITeam>;
