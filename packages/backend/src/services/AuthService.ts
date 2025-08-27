import { AuthService } from "../interfaces/services";
import { UserRepository } from "../interfaces/repositories";
import {
  LoginRequest,
  AuthResponse,
  UserInfo,
} from "@restaurant-reservation/shared";
import { JwtUtils } from "../utils/jwt";
import { PasswordUtils } from "../utils/password";

export class AuthServiceImpl implements AuthService {
  constructor(private userRepository: UserRepository) {}

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Find user by username
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await PasswordUtils.comparePassword(
      password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Create user info (without password hash)
    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    // Generate JWT token
    const token = JwtUtils.generateToken(userInfo);

    // Calculate expiration time
    const expiresIn = JwtUtils.getTokenExpirationTime();

    return {
      token,
      user: userInfo,
      expiresIn,
    };
  }

  async logout(token: string): Promise<void> {
    // In a production system, you might want to maintain a blacklist of tokens
    // For now, we'll just validate the token to ensure it's properly formatted
    try {
      JwtUtils.verifyToken(token);
    } catch (error) {
      throw new Error("Invalid token");
    }

    // Token invalidation would be handled by the client removing it
    // In a more sophisticated system, you could maintain a token blacklist
  }

  async validateToken(token: string): Promise<UserInfo> {
    try {
      const decoded = JwtUtils.verifyToken(token);

      // Verify user still exists
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw new Error("User not found");
      }

      return JwtUtils.extractUserInfo(decoded);
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  generateToken(user: UserInfo): string {
    return JwtUtils.generateToken(user);
  }

  async hashPassword(password: string): Promise<string> {
    return PasswordUtils.hashPassword(password);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return PasswordUtils.comparePassword(password, hash);
  }
}
