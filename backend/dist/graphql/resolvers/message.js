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
exports.messagePopulated = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const functions_1 = require("../../utils/functions");
const conversation_1 = require("./conversation");
const resolvers = {
    Query: {
        messages: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma } = context;
            const { conversationId } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("not autherized");
            }
            const { user: { id: userId }, } = session;
            /**
             * verift that user is participant
             */
            const conversation = yield prisma.conversation.findUnique({
                where: {
                    id: conversationId,
                },
                include: conversation_1.conversationPopulated,
            });
            if (!conversation) {
                throw new graphql_1.GraphQLError("conversaation does not exist");
            }
            const allowedToView = (0, functions_1.userIsConversationParticipant)(conversation.participants, userId);
            if (!allowedToView) {
                throw new Error("not authorized");
            }
            try {
                const messages = yield prisma.message.findMany({
                    where: {
                        conversationId,
                    },
                    include: exports.messagePopulated,
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                return messages;
            }
            catch (error) {
                console.log("messages error", error);
                throw new graphql_1.GraphQLError("error");
            }
        }),
    },
    Mutation: {
        sendMessage: (_, args, context) => __awaiter(void 0, void 0, void 0, function* () {
            const { session, prisma, pubsub } = context;
            const { id: messageId, body, senderId, conversationId } = args;
            if (!(session === null || session === void 0 ? void 0 : session.user)) {
                throw new graphql_1.GraphQLError("not authorized");
            }
            const { id: userId } = session.user;
            if (userId !== senderId) {
                throw new graphql_1.GraphQLError("not authorized");
            }
            try {
                /**
                 * create new message entity
                 */
                const newMessage = yield prisma.message.create({
                    data: {
                        id: messageId,
                        senderId,
                        conversationId,
                        body,
                    },
                    include: exports.messagePopulated,
                });
                const participant = yield prisma.conversationParticipant.findFirst({
                    where: {
                        userId,
                        conversationId,
                    },
                });
                /**
                 * Should always exist
                 */
                if (!participant) {
                    throw new graphql_1.GraphQLError("Participant does not exist");
                }
                const { id: participantId } = participant;
                /**
                 * update conversation entity
                 */
                const conversation = yield prisma.conversation.update({
                    where: {
                        id: conversationId,
                    },
                    data: {
                        latestMessageId: newMessage.id,
                        participants: {
                            update: {
                                where: {
                                    id: participantId,
                                },
                                data: {
                                    hasSeenLatestMessage: true,
                                },
                            },
                            updateMany: {
                                where: {
                                    NOT: {
                                        userId,
                                    },
                                },
                                data: {
                                    hasSeenLatestMessage: false,
                                },
                            },
                        },
                    },
                    include: conversation_1.conversationPopulated,
                });
                pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
                pubsub.publish("CONVERSATION_UPDATED", {
                    conversationUpdated: { conversation, }
                });
            }
            catch (error) {
                console.log("sendMessage error", error);
                throw new graphql_1.GraphQLError("error sending message");
            }
            return true;
        }),
    },
    Subscription: {
        messageSent: {
            subscribe: (0, graphql_subscriptions_1.withFilter)((_, __, context) => {
                const { pubsub } = context;
                return pubsub.asyncIterator(["MESSAGE_SENT"]);
            }, (payload, args, context) => {
                return payload.messageSent.conversationId === args.conversationId;
            }),
        },
    },
};
exports.messagePopulated = client_1.Prisma.validator()({
    sender: {
        select: {
            id: true,
            username: true,
        },
    },
});
exports.default = resolvers;
