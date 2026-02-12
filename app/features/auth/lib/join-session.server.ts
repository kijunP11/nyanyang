/**
 * Join Session Management Module
 *
 * This module manages temporary session data for the multi-step registration flow.
 * Step 1 (join.tsx) stores user data in a cookie, Step 2 (verify.tsx) retrieves it.
 * The cookie is encrypted and has a 10-minute TTL for security.
 */
import { createCookie } from "react-router";

/**
 * Interface for join session data
 */
export interface JoinSessionData {
  name: string;
  email: string;
  password: string;
  nickname?: string;
  referralCode?: string;
}

/**
 * Cookie for storing join session data
 * 
 * Configuration:
 * - httpOnly: true - Prevents JavaScript access for security
 * - sameSite: "lax" - CSRF protection while allowing normal navigation
 * - secure: true in production - HTTPS only
 * - maxAge: 600 - 10 minute TTL
 * - secrets: Uses environment variable for encryption
 */
export const joinCookie = createCookie("join_data", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 600, // 10 minutes
  secrets: [process.env.SESSION_SECRET || "fallback-secret-for-dev-only"],
});

/**
 * Get join session data from cookie
 */
export async function getJoinSession(request: Request): Promise<JoinSessionData | null> {
  const cookieHeader = request.headers.get("Cookie");
  const data = await joinCookie.parse(cookieHeader);
  return data as JoinSessionData | null;
}

/**
 * Create join session cookie header
 */
export async function createJoinSession(data: JoinSessionData): Promise<string> {
  return await joinCookie.serialize(data);
}

/**
 * Clear join session cookie header (set to expire)
 */
export async function clearJoinSession(): Promise<string> {
  return await joinCookie.serialize(null, { maxAge: 0 });
}
