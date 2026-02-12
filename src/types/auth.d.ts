/**
 * Auth token payload types
 * Available globally without import
 */

declare global {
  type JwtPayloadValue = string | number | boolean | null | undefined;

  type JwtPayload = {
    exp?: number;
    iat?: number;
    role?: string;
    sub?: string;
    username?: string;
  } & Record<string, JwtPayloadValue>;

  type AdminTokenPayload = JwtPayload & {
    role?: "admin";
  };
}

export {};
