"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const createUserController_1 = require("./controllers/createUserController");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_validation_1 = require("../../common/validation/express-validation");
const inputValidation_middleware_1 = require("../../middlewares/inputValidation.middleware");
const getUsers_controller_1 = require("./controllers/getUsers.controller");
const deleteUserController_1 = require("./controllers/deleteUserController");
exports.usersRouter = (0, express_1.Router)({});
exports.usersRouter.post('/', auth_middleware_1.authMiddleware, express_validation_1.loginValidation, express_validation_1.passwordValidation, express_validation_1.emailValidation, inputValidation_middleware_1.inputValidationMiddleware, createUserController_1.createUserController);
exports.usersRouter.get('/', express_validation_1.sortByValidation, express_validation_1.sortDirectionValidation, express_validation_1.pageNumberValidation, express_validation_1.pageSizeValidation, express_validation_1.searchLoginTermValidation, express_validation_1.searchEmailTermValidation, inputValidation_middleware_1.inputValidationMiddleware, getUsers_controller_1.getUsersController);
exports.usersRouter.delete('/:id', auth_middleware_1.authMiddleware, deleteUserController_1.deleteUserController);
