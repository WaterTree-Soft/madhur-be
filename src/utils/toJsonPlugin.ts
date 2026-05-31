import { Schema } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJsonPlugin(schema: Schema, opts?: { virtuals?: boolean }) {
  schema.set("toJSON", {
    virtuals: opts?.virtuals ?? false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(_doc: any, ret: any) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  });
}
