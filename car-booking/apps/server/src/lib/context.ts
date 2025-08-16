import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  
  // Extract IP address from request headers
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
    req.headers.get('x-real-ip') || 
    req.headers.get('cf-connecting-ip') ||
    'unknown';
    
  return {
    session,
    ip,
    req,
  };
}


export type Context = Awaited<ReturnType<typeof createContext>>;
