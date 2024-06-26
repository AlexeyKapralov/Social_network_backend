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
const userManager_test_1 = require("../../e2e/users/userManager.test");
const settings_1 = require("../../../src/common/config/settings");
const authManager_test_1 = require("../../e2e/auth/authManager.test");
const resultStatus_type_1 = require("../../../src/common/types/resultStatus.type");
const jwtService_1 = require("../../../src/common/adapters/jwtService");
const ioc_1 = require("../../../src/ioc");
const auth_service_1 = require("../../../src/features/auth/service/auth.service");
describe('refresh Token integration test', () => {
    const jwtService = ioc_1.container.resolve(jwtService_1.JwtService);
    const authService = ioc_1.container.resolve(auth_service_1.AuthService);
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const mongod = yield mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongod.getUri();
        yield db_1.db.run(uri);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.drop();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield db_1.db.stop();
    }));
    afterAll(done => {
        done();
    });
    it('should refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
        const inputData = {
            login: 'login',
            password: 'qwert1234',
            email: 'asdf@mail.ru'
        };
        yield userManager_test_1.userManagerTest.createUser('default', settings_1.SETTINGS.ADMIN_AUTH);
        const tokens = yield authManager_test_1.authManagerTest.authUser({ password: inputData.password, loginOrEmail: inputData.login });
        //todo почему ниже не работает деструктуризация
        // const {deviceId, userId} = jwtService.verifyAndDecodeToken(tokens!.refreshToken)
        const tokenPayload = jwtService.verifyAndDecodeToken(tokens.refreshToken);
        yield new Promise(resolve => setTimeout(resolve, 1000));
        let newTokens = yield authService.refreshToken(tokenPayload.deviceId, tokenPayload.userId, tokenPayload.iat);
        expect(newTokens.data).not.toBe(tokens);
        expect(newTokens.status).toBe(resultStatus_type_1.ResultStatus.Success);
    }));
});
