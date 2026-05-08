declare module "express-serve-static-core" {
  interface Request {
    cookies: Record<string, unknown>;
  }
}

export {};
