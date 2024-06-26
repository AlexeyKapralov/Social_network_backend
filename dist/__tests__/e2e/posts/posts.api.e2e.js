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
const mongodb_memory_server_1 = require("mongodb-memory-server");
const db_1 = require("../../../src/db/db");
const supertest_1 = require("supertest");
const app_1 = require("../../../src/app");
const postsManager_test_1 = require("./postsManager.test");
const query_model_1 = require("../../../src/common/types/query.model");
const http_status_codes_1 = require("http-status-codes");
const authManager_test_1 = require("../auth/authManager.test");
const blogsManager_test_1 = require("../blogs/blogsManager.test");
const postMappers_1 = require("../../../src/features/posts/mappers/postMappers");
const path_1 = require("../../../src/common/config/path");
const post_entity_1 = require("../../../src/features/posts/domain/post.entity");
const likesForPosts_entity_1 = require("../../../src/features/likes/domain/likesForPosts.entity");
const like_type_1 = require("../../../src/features/likes/models/like.type");
const likePosts_mapper_1 = require("../../../src/features/likes/mappers/likePosts.mapper");
describe('posts tests', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const mongod = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongod.getUri();
        yield db_1.db.run(uri);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.drop();
    }));
    it(`should get posts with filter `, () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.agent)(app_1.app)
            .get('/')
            .expect('All is running!');
    }));
    it('should get posts with default pagination and empty array', () => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.drop();
        const res = yield (0, supertest_1.agent)(app_1.app)
            .get(path_1.PATH.POSTS);
        expect(res.body).toEqual({
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: []
        });
    }));
    it('should get posts with default pagination', () => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.drop();
        yield postsManager_test_1.postsManagerTest.createPosts(20);
        const res = yield (0, supertest_1.agent)(app_1.app)
            .get(path_1.PATH.POSTS);
        expect(res.body).toEqual({
            pagesCount: 2,
            page: 1,
            pageSize: 10,
            totalCount: 20,
            items: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: expect.any(String),
                    shortDescription: expect.any(String),
                    content: expect.any(String),
                    blogId: expect.any(String),
                    blogName: expect.any(String),
                    createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
                })
            ])
        });
        const posts = yield post_entity_1.PostModel
            .find()
            .sort({ 'createdAt': 'desc' })
            .skip((1 - 1) * 10)
            .limit(10)
            .lean();
        let userId = null;
        //todo как-будто бы эту логику можно вынести в отдельный блок, т.к. она много где повторяется
        let newPosts = [];
        yield Promise.all(posts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const newestLikes = yield likesForPosts_entity_1.LikesPostsModel
                .find({ postId: post._id, description: like_type_1.LikeStatus.Like })
                .sort({ addedAt: query_model_1.SortDirection.descending })
                .limit(3)
                .lean();
            const newestLikesMapped = newestLikes.map(likePosts_mapper_1.likePostsMapper);
            let currentUserLike = null;
            if (userId) {
                currentUserLike = yield likesForPosts_entity_1.LikesPostsModel
                    .findOne({ postId: post._id, userId: userId })
                    .lean();
            }
            const currentUserLikeStatus = currentUserLike ? currentUserLike.description : like_type_1.LikeStatus.None;
            const newPost = (0, postMappers_1.getPostViewModel)(post, newestLikesMapped, currentUserLikeStatus);
            newPosts.push(newPost);
        })));
        newPosts.sort(function (a, b) {
            if (a.createdAt < b.createdAt) {
                return 1;
            }
            if (a.createdAt > b.createdAt) {
                return -1;
            }
            return 0;
        });
        expect(newPosts).toEqual(res.body.items);
    }));
    it('should get posts with custom pagination', () => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.drop();
        yield postsManager_test_1.postsManagerTest.createPosts(20);
        const query = {
            pageNumber: 3,
            pageSize: 6,
            sortBy: 'title',
            sortDirection: 'asc'
        };
        const res = yield (0, supertest_1.agent)(app_1.app)
            .get(path_1.PATH.POSTS)
            .query(query);
        expect(res.body).toEqual({
            pagesCount: Math.ceil(20 / 6),
            page: 3,
            pageSize: 6,
            totalCount: 20,
            items: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: expect.any(String),
                    shortDescription: expect.any(String),
                    content: expect.any(String),
                    blogId: expect.any(String),
                    blogName: expect.any(String),
                    createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
                })
            ])
        });
        const posts = yield post_entity_1.PostModel
            .find()
            .sort({ 'title': 'asc' })
            .skip((3 - 1) * 6)
            .limit(6)
            .lean();
        let userId = null;
        //todo как-будто бы эту логику можно вынести в отдельный блок, т.к. она много где повторяется
        let newPosts = [];
        yield Promise.all(posts.map((post) => __awaiter(void 0, void 0, void 0, function* () {
            const newestLikes = yield likesForPosts_entity_1.LikesPostsModel
                .find({ postId: post._id, description: like_type_1.LikeStatus.Like })
                .sort({ addedAt: query_model_1.SortDirection.descending })
                .limit(3)
                .lean();
            const newestLikesMapped = newestLikes.map(likePosts_mapper_1.likePostsMapper);
            let currentUserLike = null;
            if (userId) {
                currentUserLike = yield likesForPosts_entity_1.LikesPostsModel
                    .findOne({ postId: post._id, userId: userId })
                    .lean();
            }
            const currentUserLikeStatus = currentUserLike ? currentUserLike.description : like_type_1.LikeStatus.None;
            const newPost = (0, postMappers_1.getPostViewModel)(post, newestLikesMapped, currentUserLikeStatus);
            newPosts.push(newPost);
        })));
        newPosts.sort(function (a, b) {
            if (a.createdAt < b.createdAt) {
                return 1;
            }
            if (a.createdAt > b.createdAt) {
                return -1;
            }
            return 0;
        });
        expect(newPosts).toEqual(res.body.items);
    }));
    it(`shouldn't create post with no auth`, () => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, supertest_1.agent)(app_1.app)
            .post(path_1.PATH.POSTS)
            .expect(http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }));
    it(`shouldn't create post with no request body`, () => __awaiter(void 0, void 0, void 0, function* () {
        const accessToken = yield authManager_test_1.authManagerTest.createAndAuthUser();
        const res = yield (0, supertest_1.agent)(app_1.app)
            .post(path_1.PATH.POSTS)
            .set({ authorization: `Bearer ${accessToken.accessToken}` })
            .expect(http_status_codes_1.StatusCodes.BAD_REQUEST);
        expect(res.body).toEqual({
            'errorsMessages': [
                {
                    'message': 'Invalid value',
                    'field': 'title'
                },
                {
                    'message': 'Invalid value',
                    'field': 'shortDescription'
                },
                {
                    'message': 'Invalid value',
                    'field': 'content'
                },
                {
                    'message': 'blog not found',
                    'field': 'blogId'
                }
            ]
        });
    }));
    it(`should create post with correct request body and bearer token`, () => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = yield authManager_test_1.authManagerTest.createAndAuthUser();
        let accessToken;
        tokens ? accessToken = tokens.accessToken : accessToken = '';
        const createdBlog = yield blogsManager_test_1.blogsManagerTest.createBlog('default', accessToken);
        if (createdBlog) {
            const requestBody = {
                'title': 'string8',
                'shortDescription': 'string2',
                'content': 'string',
                'blogId': createdBlog.id
            };
            yield postsManager_test_1.postsManagerTest.createPost(requestBody, accessToken, http_status_codes_1.StatusCodes.CREATED, createdBlog);
        }
    }));
    it(`shouldn't get post by id with incorrect id`, () => __awaiter(void 0, void 0, void 0, function* () {
        yield postsManager_test_1.postsManagerTest.getPostById('random text', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }));
    it(`should get post by id`, () => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = yield authManager_test_1.authManagerTest.createAndAuthUser();
        let accessToken;
        tokens ? accessToken = tokens.accessToken : accessToken = '';
        const createdBlog = yield blogsManager_test_1.blogsManagerTest.createBlog('default', accessToken);
        if (createdBlog) {
            const requestBody = {
                'title': 'string8',
                'shortDescription': 'string2',
                'content': 'string',
                'blogId': createdBlog.id
            };
            const post = yield postsManager_test_1.postsManagerTest.createPost(requestBody, accessToken, http_status_codes_1.StatusCodes.CREATED, createdBlog);
            if (post) {
                yield postsManager_test_1.postsManagerTest.getPostById(post.id, http_status_codes_1.StatusCodes.OK);
            }
        }
    }));
    it(`should update post by id`, () => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = yield authManager_test_1.authManagerTest.createAndAuthUser();
        let accessToken;
        tokens ? accessToken = tokens.accessToken : accessToken = '';
        const createdBlog = yield blogsManager_test_1.blogsManagerTest.createBlog('default', accessToken);
        if (createdBlog) {
            const requestBody = {
                'title': 'a',
                'shortDescription': 'abc',
                'content': 'abcd',
                'blogId': createdBlog.id
            };
            const post = yield postsManager_test_1.postsManagerTest.createPost(requestBody, accessToken, http_status_codes_1.StatusCodes.CREATED, createdBlog);
            const requestBody2 = {
                'title': 'abc',
                'shortDescription': 'abc',
                'content': 'abcd',
                'blogId': createdBlog.id
            };
            if (post) {
                yield postsManager_test_1.postsManagerTest.updatePostById(post.id, accessToken, requestBody2);
            }
        }
    }));
    //тесты для delete post by id
    it(`should delete post`, () => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = yield authManager_test_1.authManagerTest.createAndAuthUser();
        let accessToken;
        (tokens) ? accessToken = tokens.accessToken : accessToken = '';
        const post = yield postsManager_test_1.postsManagerTest.createPost('default', accessToken);
        if (post) {
            yield postsManager_test_1.postsManagerTest.deletePost(post.id, accessToken);
        }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.stop();
    }));
    afterAll(done => {
        done();
    });
});
