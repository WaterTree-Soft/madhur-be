import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "user" | "admin" | "super_admin";
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
}
