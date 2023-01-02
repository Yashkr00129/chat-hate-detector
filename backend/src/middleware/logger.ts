import { Request, Response, NextFunction } from "express"

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log("Cookies:", req.cookies)
  console.log("Request URL:", req.url)
  console.log("Request Method:", req.method)
  console.log("Request Body:", req.body)
  console.log("Request Headers:", req.headers)
  next()
}

export default loggerMiddleware
