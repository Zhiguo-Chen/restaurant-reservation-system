import jwt from "jsonwebtoken";
import {
  User,
  UserInfo,
  JwtPayload as CustomJwtPayload,
} from "../types/shared";
import { config } from "../config/environment";

export interface JwtPayload extends UserInfo {
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export class JwtUtils {
  /**
   * Generate a JWT token for a user
   */
  static generateToken(user: UserInfo): string {
    const payload: Omit<JwtPayload, "iat" | "exp" | "iss" | "aud"> = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: "restaurant-reservation-system",
      audience: "restaurant-reservation-users",
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string): CustomJwtPayload {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: "restaurant-reservation-system",
        audience: "restaurant-reservation-users",
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid token");
      } else {
        throw new Error("Token verification failed");
      }
    }
  }

  /**
   * Decode a JWT token without verification (for debugging)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a token is expired
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time in seconds
   */
  static getTokenExpirationTime(): number {
    const expiresIn = config.JWT_EXPIRES_IN;

    if (expiresIn.endsWith("h")) {
      return parseInt(expiresIn.slice(0, -1)) * 3600; // hours to seconds
    } else if (expiresIn.endsWith("d")) {
      return parseInt(expiresIn.slice(0, -1)) * 86400; // days to seconds
    } else if (expiresIn.endsWith("m")) {
      return parseInt(expiresIn.slice(0, -1)) * 60; // minutes to seconds
    } else {
      return parseInt(expiresIn); // assume seconds
    }
  }

  /**
   * Extract user info from token payload
   */
  static extractUserInfo(payload: CustomJwtPayload): UserInfo {
    return {
      id: payload.id,
      username: payload.username,
      email: (payload as any).email || "",
      role: payload.role,
    };
  }
}
