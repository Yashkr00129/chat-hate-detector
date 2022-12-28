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
exports.conversationPopulated = exports.participantPopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../utils/functions");
const resolvers = {
    Query: {
        conversations: (_, __, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma } = context;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("Not authorized");
            }
            try {
                const { id } = session.user;
                /**
                 * Find all conversations that user is part of
                 */
                const conversations = yield prisma.conversation.findMany({
                    /**
                     * Below has been confirmed to be the correct
                     * query by the Prisma team. Has been confirmed
                     * that there is an issue on their end
                     * Issue seems specific to Mongo
                     */
                    // where: {
                    //   participants: {
                    //     some: {
                    //       userId: {
                    //         equals: id,
                    //       },
                    //     },
                    //   },
                    // },
                    include: exports.conversationPopulated,
                });
                /**
                 * Since above query does not work
                 */
                return conversations.filter((conversation) => !!conversation.participants.find((p) => p.userId === id));
            }
            catch (error) {
                console.log("error", error);
                throw new graphql_1.GraphQLError(error === null || error === void 0 ? void 0 : error.message);
            }
        }),
    },
    Mutation: {
        createConversation: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma, pubsub } = context;
            const { participantIds } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("not autherized ");
            }
            const { user: { id: userId }, } = session;
            try {
                const conversation = yield prisma.conversation.create({
                    data: {
                        participants: {
                            createMany: {
                                data: participantIds.map((id) => ({
                                    userId: id,
                                    hasSeenLatestMessage: id === userId,
                                })),
                            },
                        },
                    },
                    include: exports.conversationPopulated,
                });
                pubsub.publish("CONVERSATION_CREATED", {
                    conversationCreated: conversation,
                });
                return {
                    conversationId: conversation.id,
                };
            }
            catch (error) {
                console.log("createConversation error: " + error);
                throw new graphql_1.GraphQLError("error createConversation");
            }
        }),
        markConversationAsRead: function (_, args, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const { session, prisma } = context;
                const { userId, conversationId } = args;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                try {
                    const participant = yield prisma.conversationParticipant.findFirst({
                        where: {
                            conversationId,
                            userId,
                        }
                    });
                    if (!participant) {
                        throw new graphql_1.GraphQLError("participants entity not found");
                    }
                    yield prisma.conversationParticipant.update({
                        where: {
                            id: participant.id,
                        },
                        data: {
                            hasSeenLatestMessage: true,
                        }
                    });
                    return true;
                }
                catch (error) {
                    console.log("markconversationasread error", error);
                    throw new graphql_1.GraphQLError(error.message);
                }
            });
        },
        deleteConversation: function (_, args, context) {
            return __awaiter(this, void 0, void 0, function* () {
                const { session, prisma, pubsub } = context;
                const { conversationId } = args;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                try {
                    const [deletedConversation] = yield prisma.$transaction([
                        prisma.conversation.delete({
                            where: {
                                id: conversationId,
                            },
                            include: exports.conversationPopulated,
                        }),
                        prisma.conversationParticipant.deleteMany({
                            where: {
                                conversationId,
                            }
                        }),
                        prisma.message.deleteMany({
                            where: {
                                conversationId,
                            }
                        })
                    ]);
                    pubsub.publish("CONVERSATION_DELETED", {
                        conversationDeleted: deletedConversation,
                    });
                }
                catch (error) {
                    console.log("markconversation error", error);
                    throw new graphql_1.GraphQLError(error.message);
                }
                return true;
            });
        }
    },
    Subscription: {
        conversationCreated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
            }, (payload, _, context) => {
                const { session } = context;
                const { conversationCreated: { participants }, } = payload;
                const userIsParticipant = !!participants.find((p) => { var _a; return p.userId === ((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id); });
                return userIsParticipant;
            }),
        },
        conversationUpdated: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_UPDATED"]);
            }, (payload, _, context) => {
                var _a;
                const { session } = context;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                const { id: userId } = session.user;
                console.log(payload);
                const { conversationUpdated: { conversation: { participants }, }, } = payload;
                const userIsParticipant = (0, functions_1.userIsConversationParticipant)(participants, userId);
                const userSentLatestMessage = ((_a = payload.conversationUpdated.conversation.latestMessage) === null || _a === void 0 ? void 0 : _a.senderId) ===
                    userId;
                return ((userIsParticipant && !userSentLatestMessage));
            }),
        },
        conversationDeleted: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["CONVERSATION_DELETED"]);
            }, (payload, _, context) => {
                const { session } = context;
                if (!(session === null || session === void 0 ? void 0 : session.user)) {
                    throw new graphql_1.GraphQLError("Not authorized");
                }
                const { id: userId } = session.user;
                const { conversationDeleted: { participants }, } = payload;
                return (0, functions_1.userIsConversationParticipant)(participants, userId);
            }),
        },
    },
};
exports.participantPopulated = client_1.Prisma.validator()({
    user: {
        select: {
            id: true,
            username: true,
        },
    },
});
exports.conversationPopulated = client_1.Prisma.validator()({
    participants: {
        include: exports.participantPopulated,
    },
    latestMessage: {
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    },
});
exports.default = resolvers;
