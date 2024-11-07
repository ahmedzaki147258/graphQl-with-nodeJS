import { ApolloServer, gql } from 'apollo-server';
import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Post from "./models/Post.js";
const salt = 10;
const secretKey = 'mySecret';
mongoose.connect('mongodb://127.0.0.1:27017/graphql');

const typeDefs = gql`
    type User{
        id: ID!, name: String!, email: String!, posts: [Post!]
    }
    type Post{
        _id: ID!, title: String!, content: String!, user: User!
    }
    type LoginResponse {
        user: User
        TOKEN: String
        statusCode: Int
    }
    input userInput {
        name: String!, email: String!, password: String!
    }
    
    type Query {
        hello: String
        users: [User]
        userById(id: String): User
        getPostsByUser(token: String!): [Post]
    }
    type Mutation {
        login(email: String!, password: String!): LoginResponse
        signup(input: userInput): User
        createPost(title: String!, content: String!, token: String!): Post
    }
`;
const resolvers = {
    Query: {
        hello: (_) => 'Success Hello World!',
        users: async (_) => User.find().populate('posts'),
        userById: async (_, {id}) => User.findById(id).populate('posts'),
        getPostsByUser: async (_, {token}) => {
            const posts = await Post.find({userId: (await jwt.verify(token, secretKey))['userId']}).populate('userId')
            return posts.map(post => ({...post.toJSON(), user: post.userId}));
        }
    },
    Mutation: {
        login: async (_, {email, password}) => {
            const userLogin = await User.findOne({email});
            if (userLogin) {
                if(await bcrypt.compare(password, userLogin?.password)){
                    const token = jwt.sign({userId: userLogin._id}, secretKey);
                    return { user: userLogin, TOKEN: token };
                } else {
                    throw new Error("Invalid password");
                }
            } else {
                throw new Error("Invalid email");
            }
        },
        signup: async (_, {input}) => {
            const {name, email, password} = input;
            const hashedPassword = await bcrypt.hash(password, salt);
            const userSignup = new User({name, email, password: hashedPassword});
            await userSignup.save();
            return userSignup;
        },
        createPost: async (_, {title, content, token}) => {
            const newPost = new Post({title, content, userId: (await jwt.verify(token, secretKey))['userId']});
            await newPost.save();
            const post = await Post.findById(newPost.id).populate('userId');
            return {...post._doc, user: post.userId};
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});
server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});