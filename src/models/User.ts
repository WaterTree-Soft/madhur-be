import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { toJsonPlugin } from "../utils/toJsonPlugin";

export type UserRole = "user" | "admin" | "super_admin";
export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  confirmed: boolean;
  blocked: boolean;
  provider: AuthProvider;
  googleId?: string;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: ["user", "admin", "super_admin"], default: "user" },
    avatar: { type: String },
    confirmed: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, sparse: true, unique: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
  },
  { timestamps: true }
);

// Virtual so existing code reading user.name still works
userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

toJsonPlugin(userSchema, { virtuals: true });

export const User = mongoose.model<IUser>("User", userSchema);
