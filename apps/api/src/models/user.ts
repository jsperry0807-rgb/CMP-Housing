import {
  model,
  Schema,
  type HydratedDocument,
  type Model,
} from "mongoose";
import { hashPassword, verifyPassword } from "../lib/password.js";

export interface IUser {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  verifyPassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Never selected by default — query it explicitly with .select("+password").
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        const serialized = ret as Record<string, unknown>;
        delete serialized.password;
        return serialized;
      },
    },
  },
);

// Hash the password whenever it changes, so callers only ever set plaintext.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await hashPassword(this.password);
});

userSchema.methods.verifyPassword = function (candidate: string) {
  return verifyPassword(candidate, this.password);
};

export const User = model<IUser, UserModel>("User", userSchema);

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
