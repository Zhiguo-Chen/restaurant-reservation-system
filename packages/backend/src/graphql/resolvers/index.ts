import { scalarResolvers } from "../scalars";
import { userResolvers } from "./userResolvers";
import { reservationResolvers } from "./reservationResolvers";
import { authResolvers } from "./authResolvers";

export const resolvers = {
  ...scalarResolvers,

  Query: {
    ...userResolvers.Query,
    ...reservationResolvers.Query,
    ...authResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...reservationResolvers.Mutation,
  },

  Subscription: {
    ...reservationResolvers.Subscription,
  },
};
