export enum UserRole {
  EMPLOYEE = "EMPLOYEE",
  ADMIN = "ADMIN",
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserInfo {
  id: string;
  username: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
  expiresIn: number;
}
