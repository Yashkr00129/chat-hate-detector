"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const typeDefs = (0, graphql_tag_1.default) `
scalar Date
  type Mutation {
    createConversation(participantIds: [String]): CreateConversationResponse
    markConversationAsRead(userId: String!, conversationId: String!):Boolean
   deleteConversation(conversationId: String!):Boolean
  }

  type CreateConversationResponse {
    conversationId: String
  }
  type ConversationUpdatedSubscriptionPayload {
    conversation: Conversation
  }
  type ConversationDeletedResponse {
    id: String
  }


  type Conversation{
    id: String
    latestMessage: Message
    participants: [Participant]
    createdAt: Date
    updatedAt: Date
  }

  type Participant{
    id: String
    user: User
    hasSeenLatestMessage: Boolean 
  }

  type Query {
    conversations: [Conversation]
  }

  type Subscription {
    conversationCreated: Conversation
  }
  type Subscription {
    conversationUpdated: ConversationUpdatedSubscriptionPayload
  }
  type Subscription {
    conversationDeleted: ConversationDeletedResponse
  }
`;
exports.default = typeDefs;
