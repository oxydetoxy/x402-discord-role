import type { NextFunction, Request, Response } from "express";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] ?? "";
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (token !== process.env.BACKEND_API_KEY) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    next();
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};
