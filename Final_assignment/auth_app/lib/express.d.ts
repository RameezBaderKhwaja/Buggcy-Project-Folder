import type { AuthUser } from "./types"

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user?: User
    }
  }
}
