import { Request } from "express";

export function getPagination(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(req.query.pageSize as string) || 10)
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}
