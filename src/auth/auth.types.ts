import { AdminRole } from "@prisma/client";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  role: AdminRole;
  sessionId: string;
  csrfTokenHash: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthenticatedAdmin;
    }
  }
}
