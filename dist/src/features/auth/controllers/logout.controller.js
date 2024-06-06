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
exports.logoutController = void 0;
const resultStatus_type_1 = require("../../../common/types/resultStatus.type");
const http_status_codes_1 = require("http-status-codes");
const jwt_service_1 = require("../../../common/adapters/jwt.service");
const authCompositionRoot_1 = require("../authCompositionRoot");
const logoutController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    const tokenPayload = jwt_service_1.jwtService.verifyAndDecodeToken(refreshToken);
    const result = yield authCompositionRoot_1.authService.logout(tokenPayload.deviceId, tokenPayload.userId, tokenPayload.iat);
    if (result.status === resultStatus_type_1.ResultStatus.Success) {
        res.status(http_status_codes_1.StatusCodes.NO_CONTENT).json();
    }
    if (result.status === resultStatus_type_1.ResultStatus.BadRequest) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json();
    }
    if (result.status === resultStatus_type_1.ResultStatus.Unauthorized) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json(result.errorMessage);
    }
});
exports.logoutController = logoutController;