"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsService = void 0;
const blogs_repository_1 = require("../blogs/repository/blogs.repository");
const posts_repository_1 = require("./repository/posts.repository");
const posts_service_1 = require("./service/posts.service");
const users_repository_1 = require("../users/repository/users.repository");
const blogsRepository = new blogs_repository_1.BlogsRepository();
const postsRepository = new posts_repository_1.PostsRepository(blogsRepository);
const usersRepository = new users_repository_1.UsersRepository();
exports.postsService = new posts_service_1.PostsService(blogsRepository, postsRepository, usersRepository);
