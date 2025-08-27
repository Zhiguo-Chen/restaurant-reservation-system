import { scalarResolvers } from "../scalars";
import { userResolvers } from "./userResolvers";
import { reservationResolvers } from "./reservationResolvers";

export const resolvers = {
  ...scalarResolvers,

  Query: {
    ...userResolvers.Query,
    ...reservationResolvers.Query,
  },

  Mutation: {
    ...reservationResolvers.Mutation,
  },

  Subscription: {
    ...reservationResolvers.Subscription,
  },
};
