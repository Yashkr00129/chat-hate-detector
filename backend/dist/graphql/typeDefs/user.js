"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const typeDefs = (0, graphql_tag_1.default) `

type User{
    id: String
    username: String
}

type Query{
    searchUsers(username: String) : [User]
}
type Mutation{
    createUsername(username:String): CreateUserNameResponse
}
type CreateUserNameResponse{
    success: Boolean
    error : String
}


`;
exports.default = typeDefs;
