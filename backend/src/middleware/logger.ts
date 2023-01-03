import { Request, Response, NextFunction } from "express";

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Request Headers:", req.headers);
  next();
};

export default loggerMiddleware;
