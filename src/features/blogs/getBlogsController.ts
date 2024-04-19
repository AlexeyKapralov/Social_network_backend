import { query, Request, Response } from 'express'
import { blogsCollection, BlogType } from '../../db/db'
import { StatusCodes } from 'http-status-codes'
import {
	blogViewModelType,
	paginatorBlogViewModelType
} from './models/blogViewModelType'
import { blogsService } from '../../services/blogs.service'
import { getQueryWithDefault, QueryType } from '../../utils'

export const getBlogsController = async (
	req: Request<{}, {}, {}, { [key: string]: string | undefined }>,
	res: Response<paginatorBlogViewModelType>
) => {
	const query: QueryType = getQueryWithDefault(req.query)

	const blogs = await blogsService.findBlogs(query)

	res.status(StatusCodes.OK).json(blogs)
	return
}