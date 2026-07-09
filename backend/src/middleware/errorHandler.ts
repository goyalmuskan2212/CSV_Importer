import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[error]", err);

  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Max size is 10MB." });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof Error && err.message === "Only .csv files are accepted.") {
    return res.status(400).json({ error: err.message });
  }

  const message =
    err instanceof Error ? err.message : "Internal server error.";

  return res.status(500).json({ error: message });
}
