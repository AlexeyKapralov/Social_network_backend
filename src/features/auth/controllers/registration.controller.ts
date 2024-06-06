import { Request, Response } from 'express'
import { IUserInputModel } from '../../users/models/userInput.model'
import { StatusCodes } from 'http-status-codes'
import { ResultStatus } from '../../../common/types/resultStatus.type'
import {authService} from "../authCompositionRoot";

export const registrationController = async (req: Request<{},{},IUserInputModel>, res: Response<StatusCodes>) => {
	const result = await authService.registrationUser(req.body)

	if (result.status === ResultStatus.Success) {
		res.status(StatusCodes.NO_CONTENT).json()
	}
	if (result.status === ResultStatus.BadRequest) {
		res.status(StatusCodes.BAD_REQUEST).json()
	}
}