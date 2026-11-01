import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "sokolink_super_secret_jwt_key_kenya_ecommerce_2026_xyz"
);

// Neon Auth Remote JWKS for Managed Better Auth JWT token verification
const neonJwks = process.env.NEON_AUTH_JWKS_URL
  ? createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL))
  : null;

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  smeId?: string;
  deliveryId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  // 1. Try local HMAC SHA-256 JWT
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    // 2. Fall back to Neon Auth JWKS if token was minted by Neon Auth / Better Auth
    if (neonJwks) {
      try {
        const { payload } = await jwtVerify(token, neonJwks);
        return {
          userId: (payload.sub || payload.userId || payload.id) as string,
          email: (payload.email || "") as string,
          role: ((payload.role as string)?.toUpperCase() as Role) || Role.CUSTOMER,
          name: (payload.name || payload.email || "") as string,
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}
