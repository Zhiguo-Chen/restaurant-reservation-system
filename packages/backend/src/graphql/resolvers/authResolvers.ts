import { AuthenticationError, ForbiddenError } from "apollo-server-express";
import { GraphQLContext } from "../context";
import { LoginInput } from "../../types/auth";

export const authResolvers = {
  Query: {
    validateToken: async (_: any, __: any, context: GraphQLContext) => {
      try {
        // If we reach here, the token is valid (middleware would have thrown otherwise)
        if (context.user) {
          return {
            valid: true,
            user: context.user,
            timestamp: new Date(),
          };
        } else {
          return {
            valid: false,
            user: null,
            timestamp: new Date(),
          };
        }
      } catch (error) {
        return {
          valid: false,
          user: null,
          timestamp: new Date(),
        };
      }
    },
  },

  Mutation: {
    login: async (
      _: any,
      { input }: { input: LoginInput },
      context: GraphQLContext
    ) => {
      try {
        const { username, password } = input;

        if (!username || !password) {
          throw new AuthenticationError("Username and password are required");
        }

        console.log("Login attempt:", { username, password: "***" });

        // Use the auth service to login
        const authResult = await context.authService.login({
          username,
          password,
        });

        console.log("Auth result:", {
          success: authResult.success,
          hasUser: !!authResult.user,
          hasToken: !!authResult.token,
        });

        if (!authResult.success || !authResult.user || !authResult.token) {
          throw new AuthenticationError("Invalid credentials");
        }

        return {
          token: authResult.token,
          user: authResult.user,
          expiresIn: 3600, // Default 1 hour
        };
      } catch (error) {
        console.error("Login error:", error);
        if (error instanceof AuthenticationError) {
          throw error;
        }
        throw new AuthenticationError(
          "Authentication failed: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    },

    logout: async (_: any, __: any, context: GraphQLContext) => {
      try {
        // For JWT tokens, logout is typically handled client-side
        // But we can add server-side token blacklisting if needed

        // If you want to implement server-side logout:
        // await context.authService.logout(context.token);

        return {
          message: "Logged out successfully",
          timestamp: new Date(),
        };
      } catch (error) {
        throw new Error("Logout failed");
      }
    },
  },
};
