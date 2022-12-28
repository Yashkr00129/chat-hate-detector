import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { getSession } from "next-auth/react";

const __DEV__ = process.env.NODE_ENV !== "production";

const httpLink = new HttpLink({
  uri: __DEV__
    ? "http://localhost:4000/graphql"
    : "chat-hate-detector-production.up.railway.app/graphql",
  credentials: "include",
});

const wsLink =
  typeof window != "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: __DEV__
            ? "ws://localhost:4000/graphql/subscriptions"
            : "ws://chat-hate-detector-production.up.railway.app/graphql/subscriptions",
          connectionParams: async () => ({ session: await getSession() }),
        })
      )
    : null;

const link =
  typeof window != "undefined" && wsLink != null
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
          );
        },
        wsLink,
        httpLink
      )
    : httpLink;

export const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});
