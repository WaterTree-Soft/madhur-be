import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export type UserRole = "user" | "admin" | "super_admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  confirmed: boolean;
  blocked: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin", "super_admin"], default: "user" },
    avatar: { type: String },
    confirmed: { type: Boolean, default: true },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

toJsonPlugin(userSchema);

export const User = mongoose.model<IUser>("User", userSchema);
