import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config"

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const headerKey = req.header("x-api-key")
  const authHeader = req.header("authorization")

  if (config.apiKey && headerKey === config.apiKey) {
    ;(req as any).user = { method: "api-key" }
    return next()
  }

  if (authHeader?.startsWith("Bearer ") && config.jwtSecret) {
    const token = authHeader.replace("Bearer ", "")
    try {
      const payload = jwt.verify(token, config.jwtSecret)
      ;(req as any).user = { method: "jwt", payload }
      return next()
    } catch (err) {
      return res.status(401).json({ success: false, error: "invalid_token" })
    }
  }

  return res.status(401).json({ success: false, error: "unauthorized" })
}

