import { Response } from "express";

export function sendSuccess(
  res: Response,
  data: unknown,
  meta?: Record<string, unknown>,
  status = 200
) {
  const body: Record<string, unknown> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  message: string,
  status = 400,
  details?: unknown
) {
  const body: Record<string, unknown> = { success: false, error: message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}

export function paginationMeta(page: number, pageSize: number, total: number) {
  return {
    pagination: {
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      total,
    },
  };
}
