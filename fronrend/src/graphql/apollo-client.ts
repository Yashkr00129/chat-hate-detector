import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { getSession } from "next-auth/react";

const httpLink = new HttpLink({
  uri: "https://imessage-server.up.railway.app/graphql",
  // uri: "http://localhost:5000/graphql",
  credentials: "include",
  fetchOptions: {
    headers: {
      Cookie: async () => ({ session: await getSession() }),
    },
  },
});

const wsLink =
  typeof window != "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: "ws://imessage-server.up.railway.app/graphql/subscriptions",
          // url: "ws://localhost:5000/graphql/subscriptions",
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
  credentials: "include",
});
