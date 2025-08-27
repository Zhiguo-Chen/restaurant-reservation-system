import { GraphQLContext, requireAuth } from "../context";
import { UserInfo } from "../../types/shared";
import { User } from "../../types/shared";

export const userResolvers = {
  Query: {
    /**
     * Get current authenticated user information
     */
    me: async (
      _parent: any,
      _args: any,
      context: GraphQLContext
    ): Promise<UserInfo> => {
      const user = requireAuth(context);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    },
  },
};
