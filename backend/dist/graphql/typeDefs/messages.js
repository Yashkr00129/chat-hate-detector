"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const typeDefs = (0, graphql_tag_1.default) `

type Message{
    id: String
    sender : User
    body: String
    createdAt: Date
}
type Query{
    messages(conversationId: String): [Message]
}
type Mutation{
    sendMessage(
    id: String
    senderId : String
    body: String
    conversationId: String
    ): Boolean
} 

type Subscription{
    messageSent(conversationId:String): Message
}

`;
exports.default = typeDefs;
