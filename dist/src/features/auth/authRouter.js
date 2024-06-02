"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const loginController_1 = require("./controllers/loginController");
const getUserInfo_1 = require("./controllers/getUserInfo");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_validation_1 = require("../../common/validation/express-validation");
const inputValidation_middleware_1 = require("../../middlewares/inputValidation.middleware");
const registration_controller_1 = require("./controllers/registration.controller");
const registrationConfirmation_controller_1 = require("./controllers/registrationConfirmation.controller");
const emailResending_controller_1 = require("./controllers/emailResending.controller");
const refreshToken_controller_1 = require("./controllers/refreshToken.controller");
const logout_controller_1 = require("./controllers/logout.controller");
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const checkCookie_middleware_1 = require("../../middlewares/checkCookie.middleware");
const passwordRecovery_controller_1 = require("./controllers/passwordRecovery.controller");
const newPassword_controller_1 = require("./controllers/newPassword.controller");
exports.authRouter = (0, express_1.Router)({});
exports.authRouter.post('/login', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.loginOrEmailValidation, express_validation_1.passwordValidation, inputValidation_middleware_1.inputValidationMiddleware, loginController_1.loginController);
exports.authRouter.post('/password-recovery', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.emailValidationForRecovery, inputValidation_middleware_1.inputValidationMiddleware, passwordRecovery_controller_1.passwordRecoveryController);
exports.authRouter.post('/new-password', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.passwordValidation, inputValidation_middleware_1.inputValidationMiddleware, newPassword_controller_1.newPasswordController);
exports.authRouter.post('/refresh-token', rateLimit_middleware_1.rateLimitMiddleware, checkCookie_middleware_1.checkCookieMiddleware, refreshToken_controller_1.refreshTokenController);
exports.authRouter.post('/registration', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.loginValidation, express_validation_1.passwordValidation, express_validation_1.emailValidationForRegistration, inputValidation_middleware_1.inputValidationMiddleware, registration_controller_1.registrationController);
exports.authRouter.post('/registration-confirmation', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.codeValidation, inputValidation_middleware_1.inputValidationMiddleware, registrationConfirmation_controller_1.registrationConfirmationController);
exports.authRouter.post('/registration-email-resending', rateLimit_middleware_1.rateLimitMiddleware, express_validation_1.emailValidationForResend, inputValidation_middleware_1.inputValidationMiddleware, emailResending_controller_1.emailResendingController);
exports.authRouter.post('/logout', rateLimit_middleware_1.rateLimitMiddleware, checkCookie_middleware_1.checkCookieMiddleware, logout_controller_1.logoutController);
exports.authRouter.get('/me', rateLimit_middleware_1.rateLimitMiddleware, auth_middleware_1.authMiddleware, getUserInfo_1.getUserInfoController);
