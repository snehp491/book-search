const { User } = require('../models');
const { signToken } = require('../utils/auth');
const { AuthenticationError } = require('apollo-server-express');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id }).select(
                    '-__v -password'
                );
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPassword = await user.isCorrectPassword(password);
            if (!correctPassword) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, args) => {
            const createdUser = User.create(args);
            const token = signToken(createdUser);
            return { createdUser, token };
        },
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const savedBook = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {$push: { savedBooks: bookData }},
                    {new: true}
                );
                return savedBook;
            }
            throw new AuthenticationError('Incorrect credentials');
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                return await User.findOneAndUpdate(
                    { _id: context.user._id },
                    {$pull: { savedBooks: bookId }},
                    {new: true, runValidators: true}
                );
            }
            throw new AuthenticationError('Incorrect credentials');
        }
    }
};

module.exports = resolvers;