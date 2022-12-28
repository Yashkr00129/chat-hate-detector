"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const resolvers = {
    Query: {
        searchUsers: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { username: searchedUsername } = args;
            const { prisma, session } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("Not Authorized");
            }
            const { user: { username: myUsername }, } = session;
            try {
                const users = yield prisma.user.findMany({
                    where: {
                        username: {
                            contains: searchedUsername,
                            not: myUsername,
                            mode: "insensitive",
                        },
                    },
                });
                console.log(users);
                return users;
            }
            catch (error) {
                console.log("SearchUsers error", error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
    },
    Mutation: {
        createUsername: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { username } = args;
            const { session, prisma } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                return {
                    error: "Not Authorized",
                };
            }
            const { id } = session.user;
            try {
                const existinguser = yield prisma.user.findUnique({
                    where: { username },
                });
                if (existinguser) {
                    return {
                        error: "Username already exists",
                    };
                }
                yield prisma.user.update({
                    where: { id },
                    data: { username },
                });
                return { sucess: true };
            }
            catch (error) {
                console.log(error);
                return { error: error };
            }
        }),
    },
    // Subscription: {},
};
exports.default = resolvers;
