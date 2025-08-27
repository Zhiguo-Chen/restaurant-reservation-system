import { GraphQLContext, requireAuth } from "../context";
import { UserInfo } from "@restaurant-reservation/shared";

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
      return requireAuth(context);
    },
  },
};
