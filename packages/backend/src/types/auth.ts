// GraphQL Auth types
export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthPayload {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
  expiresIn: number;
}

export interface LogoutResponse {
  message: string;
  timestamp: Date;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    role: string;
  };
  timestamp: Date;
}
