import { eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import { comments, participants } from "@/db/schema";

import { randomid } from "./nanoid";

const SECRET_PASSWORD = process.env.SECRET_PASSWORD ?? "";

/**
 * Encrypt data using Web Crypto API (AES-GCM).
 * Replaces iron-session's sealData.
 */
async function encrypt(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password.slice(0, 32).padEnd(32, "0")),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    encoder.encode(data),
  );
  // Combine IV + ciphertext and encode as base64url
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Decrypt data using Web Crypto API (AES-GCM).
 * Replaces iron-session's unsealData.
 */
async function decrypt(token: string, password: string): Promise<string> {
  const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password.slice(0, 32).padEnd(32, "0")),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    keyMaterial,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Create an encrypted token with a payload and TTL.
 * Replaces iron-session's sealData.
 */
export const createToken = async <T extends Record<string, unknown>>(
  payload: T,
) => {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return encrypt(data, SECRET_PASSWORD);
};

/**
 * Decrypt and validate a token.
 * Replaces iron-session's unsealData.
 */
export const decryptToken = async <P extends Record<string, unknown>>(
  token: string,
): Promise<P> => {
  const json = await decrypt(token, SECRET_PASSWORD);
  const data = JSON.parse(json);
  if (data.exp && Date.now() > data.exp) {
    throw new Error("Token expired");
  }
  return data as P;
};

/**
 * Session cookie utilities for Astro middleware.
 * Replaces iron-session's withIronSessionApiRoute / withIronSessionSsr.
 */
export interface SessionUser {
  id: string;
  isGuest: boolean;
}

export interface SessionData {
  user: SessionUser;
}

const COOKIE_NAME = "rallly-session";

export async function getSessionFromCookie(
  cookieValue: string | undefined,
): Promise<SessionData | null> {
  if (!cookieValue) return null;
  try {
    const json = await decrypt(cookieValue, SECRET_PASSWORD);
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export async function createSessionCookie(
  session: SessionData,
): Promise<string> {
  const value = await encrypt(JSON.stringify(session), SECRET_PASSWORD);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

export const createGuestUser = async (): Promise<{
  isGuest: true;
  id: string;
}> => {
  return {
    id: `user-${await randomid()}`,
    isGuest: true,
  };
};

// assigns participants and comments created by guests to a user
export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  const db = getDb();

  await db
    .update(participants)
    .set({ userId })
    .where(inArray(participants.userId, guestIds));

  await db
    .update(comments)
    .set({ userId })
    .where(inArray(comments.userId, guestIds));
};
