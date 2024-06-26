import {MongoMemoryServer} from 'mongodb-memory-server'
import {db} from '../../../src/db/db'
import {agent} from 'supertest'
import {app} from '../../../src/app'
import {postsManagerTest} from './postsManager.test'
import {IQueryInputModel, SortDirection} from '../../../src/common/types/query.model'
import {StatusCodes} from 'http-status-codes'
import {authManagerTest} from '../auth/authManager.test'
import {blogsManagerTest} from '../blogs/blogsManager.test'
import {IPostInputModel} from '../../../src/features/posts/models/postInput.model'
import {IBlogViewModel} from '../../../src/features/blogs/models/blogView.model'
import {getPostViewModel} from "../../../src/features/posts/mappers/postMappers";
import {PATH} from "../../../src/common/config/path";
import {PostModel} from "../../../src/features/posts/domain/post.entity";
import {IPostViewModel} from "../../../src/features/posts/models/postView.model";
import {LikesPostsModel} from "../../../src/features/likes/domain/likesForPosts.entity";
import {ILikePostsDbModel, LikeStatus} from "../../../src/features/likes/models/like.type";
import {likePostsMapper} from "../../../src/features/likes/mappers/likePosts.mapper";

describe('posts tests', () => {
    beforeAll(async () => {
        const mongod = await MongoMemoryServer.create()
        const uri = mongod.getUri()
        await db.run(uri)
    })
    beforeEach(async () => {
        await db.drop()
    })

    afterAll(async () => {
        await db.stop()
    })

    afterAll(done => {
        done()
    })

    it(`should get posts with filter `, async () => {
        await agent(app)
            .get('/')
            .expect('All is running!')
    })

    it('should get posts with default pagination and empty array', async () => {
        await db.drop()

        const res = await agent(app)
            .get(PATH.POSTS)

        expect(res.body).toEqual({
            pagesCount: 0,
            page: 1,
            pageSize: 10,
            totalCount: 0,
            items: []
        })
    })

    it('should get posts with default pagination', async () => {
        await db.drop()
        await postsManagerTest.createPosts(20)

        const res = await agent(app)
            .get(PATH.POSTS)

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
        })

        const posts = await PostModel
            .find()
            .sort({'createdAt': 'desc'})
            .skip((1 - 1) * 10)
            .limit(10)
            .lean()

        let userId = null
        //todo как-будто бы эту логику можно вынести в отдельный блок, т.к. она много где повторяется
        let newPosts: IPostViewModel[] = []
        await Promise.all(
            posts.map(
                async post => {
                    const newestLikes = await LikesPostsModel
                        .find({postId: post._id, description: LikeStatus.Like})
                        .sort({addedAt: SortDirection.descending})
                        .limit(3)
                        .lean()

                    const newestLikesMapped = newestLikes.map(likePostsMapper)

                    let currentUserLike: ILikePostsDbModel | null = null
                    if (userId) {
                        currentUserLike = await LikesPostsModel
                            .findOne({postId: post._id, userId: userId})
                            .lean()
                    }

                    const currentUserLikeStatus: LikeStatus = currentUserLike ? currentUserLike.description as LikeStatus : LikeStatus.None

                    const newPost = getPostViewModel(post, newestLikesMapped, currentUserLikeStatus)
                    newPosts.push(newPost)
                }
            )
        )

        newPosts.sort(function (a, b) {
            if (a.createdAt < b.createdAt) {
                return 1;
            }
            if (a.createdAt > b.createdAt) {
                return -1;
            }
            return 0;
        });

        expect(newPosts).toEqual(res.body.items)
    })

    it('should get posts with custom pagination', async () => {
        await db.drop()
        await postsManagerTest.createPosts(20)

        const query: IQueryInputModel = {
            pageNumber: 3,
            pageSize: 6,
            sortBy: 'title',
            sortDirection: 'asc'
        }
        const res = await agent(app)
            .get(PATH.POSTS)
            .query(
                query
            )

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
                    createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
                    extendedLikesInfo: {
                        dislikesCount: 0,
                        likesCount: 0,
                        myStatus: "None",
                        newestLikes: expect.arrayContaining([]),
                    }
                })
            ])
        })

        const posts = await PostModel
            .find()
            .sort({'title': 'asc'})
            .skip((3 - 1) * 6)
            .limit(6)
            .lean()

        let userId = null
        //todo как-будто бы эту логику можно вынести в отдельный блок, т.к. она много где повторяется
        let newPosts: IPostViewModel[] = []
        await Promise.all(
            posts.map(
                async post => {
                    const newestLikes = await LikesPostsModel
                        .find({postId: post._id, description: LikeStatus.Like})
                        .sort({addedAt: SortDirection.descending})
                        .limit(3)
                        .lean()

                    const newestLikesMapped = newestLikes.map(likePostsMapper)

                    let currentUserLike: ILikePostsDbModel | null = null
                    if (userId) {
                        currentUserLike = await LikesPostsModel
                            .findOne({postId: post._id, userId: userId})
                            .lean()
                    }

                    const currentUserLikeStatus: LikeStatus = currentUserLike ? currentUserLike.description as LikeStatus : LikeStatus.None

                    const newPost = getPostViewModel(post, newestLikesMapped, currentUserLikeStatus)
                    newPosts.push(newPost)
                }
            )
        )

        newPosts.sort(function (a, b) {
            if (a.createdAt < b.createdAt) {
                return 1;
            }
            if (a.createdAt > b.createdAt) {
                return -1;
            }
            return 0;
        });

        expect(newPosts).toEqual(res.body.items)
    })

    it(`shouldn't create post with no auth`, async () => {
        await agent(app)
            .post(PATH.POSTS)
            .expect(StatusCodes.UNAUTHORIZED)
    })

    it(`shouldn't create post with no request body`, async () => {
        const accessToken = await authManagerTest.createAndAuthUser()
        const res = await agent(app)
            .post(PATH.POSTS)
            .set({authorization: `Bearer ${accessToken!.accessToken}`})
            .expect(StatusCodes.BAD_REQUEST)

        expect(res.body).toEqual(
            {
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
            }
        )
    })

    it(`should create post with correct request body and bearer token`, async () => {
        const tokens = await authManagerTest.createAndAuthUser()
        let accessToken
        tokens ? accessToken = tokens.accessToken : accessToken = ''
        const createdBlog: IBlogViewModel | undefined = await blogsManagerTest.createBlog('default', accessToken!)
        if (createdBlog) {
            const requestBody: IPostInputModel = {
                'title': 'string8',
                'shortDescription': 'string2',
                'content': 'string',
                'blogId': createdBlog!.id
            }

            await postsManagerTest.createPost(requestBody, accessToken!, StatusCodes.CREATED, createdBlog)
        }
    })

    it(`shouldn't get post by id with incorrect id`, async () => {
        await postsManagerTest.getPostById('random text', StatusCodes.BAD_REQUEST)
    })

    it(`should get post by id`, async () => {
        const tokens = await authManagerTest.createAndAuthUser()
        let accessToken
        tokens ? accessToken = tokens.accessToken : accessToken = ''
        const createdBlog: IBlogViewModel | undefined = await blogsManagerTest.createBlog('default', accessToken!)
        if (createdBlog) {
            const requestBody = {
                'title': 'string8',
                'shortDescription': 'string2',
                'content': 'string',
                'blogId': createdBlog!.id
            }

            const post = await postsManagerTest.createPost(requestBody, accessToken!, StatusCodes.CREATED, createdBlog)
            if (post) {
                await postsManagerTest.getPostById(post.id, StatusCodes.OK)
            }

        }
    })

    it(`should update post by id`, async () => {
        const tokens = await authManagerTest.createAndAuthUser()
        let accessToken
        tokens ? accessToken = tokens.accessToken : accessToken = ''
        const createdBlog: IBlogViewModel | undefined = await blogsManagerTest.createBlog('default', accessToken!)
        if (createdBlog) {
            const requestBody = {
                'title': 'a',
                'shortDescription': 'abc',
                'content': 'abcd',
                'blogId': createdBlog!.id
            }

            const post = await postsManagerTest.createPost(requestBody, accessToken!, StatusCodes.CREATED, createdBlog)

            const requestBody2 = {
                'title': 'abc',
                'shortDescription': 'abc',
                'content': 'abcd',
                'blogId': createdBlog!.id
            }

            if (post) {
                await postsManagerTest.updatePostById(post.id, accessToken!, requestBody2)
            }

        }
    })

    //тесты для delete post by id
    it(`should delete post`, async () => {
        const tokens = await authManagerTest.createAndAuthUser()
        let accessToken
        (tokens) ? accessToken = tokens.accessToken : accessToken = ''
        const post = await postsManagerTest.createPost('default', accessToken)
        if (post) {
            await postsManagerTest.deletePost(post.id, accessToken)
        }
    });


    it('create jwt token, create post, like post and get post, should likeStatus like', async () => {
        const tokens = await authManagerTest.createAndAuthUser()

        const post = await postsManagerTest.createPost('default', tokens!.accessToken)

        expect(post).toEqual(
            {
                id: expect.any(String),
                title: expect.any(String),
                shortDescription: expect.any(String),
                content: expect.any(String),
                blogId: expect.any(String),
                blogName: expect.any(String),
                createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
                extendedLikesInfo: {
                    likesCount: 0,
                    dislikesCount: 0,
                    newestLikes: [],
                    myStatus: 'None'
                }
            }
        )

        await agent(app)
            .put(`${PATH.POSTS}/${post!.id}/like-status`)
            .set({authorization: `Bearer ${tokens!.accessToken}`})
            .send({
                "likeStatus": "Like"
            })
            .expect(StatusCodes.NO_CONTENT)

        const updatedPostResponse = await agent(app)
            .get(`${PATH.POSTS}/${post!.id}`)
            .set({authorization: `Bearer ${tokens!.accessToken}`})
            .expect(StatusCodes.OK)

        expect(updatedPostResponse.body).toEqual({
            id: expect.any(String),
            title: expect.any(String),
            shortDescription: expect.any(String),
            content: expect.any(String),
            blogId: expect.any(String),
            blogName: expect.any(String),
            createdAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
            extendedLikesInfo: {
                likesCount: 1,
                dislikesCount: 0,
                newestLikes: expect.arrayContaining([
                    {
                        addedAt: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
                        login: expect.any(String),
                        userId: expect.any(String),
                    }
                ]),
                myStatus: 'Like'
            }
        })

    })

})
