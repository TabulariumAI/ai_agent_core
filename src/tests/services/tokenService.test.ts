import { TokenService } from '../../infrastructure/services/tokenService';

describe('TokenService', () => {
    let tokenService: TokenService;
    const testData = '/url?sn=123';

    beforeEach(() => {
        process.env.TOKEN_SECRET = 'test_secret';
        tokenService = new TokenService();
    });

    it('should sign and validate a token successfully', () => {
        const token = tokenService.sign(testData);
        expect(tokenService.validate(testData, token)).toBe(true);
    });

    it('should fail validation for expired token', () => {
        // Generate a token with expiration in the past
        const pastExpiration = (Math.floor(Date.now() / 1000) - 10).toString();
        // @ts-ignore: access private method for test
        const token = tokenService['generate'](testData, pastExpiration);
        expect(tokenService.validate(testData, token)).toBe(false);
    });

    it('should fail validation if signature is tampered', () => {
        const token = tokenService.sign(testData);
        const tamperedToken = token.replace(/sig=[^&]+/, 'sig=abcdef123456');
        expect(tokenService.validate(testData, tamperedToken)).toBe(false);
    });

    it('should fail validation if expiration is missing', () => {
        const token = `sig=abcdef123456`;
        expect(tokenService.validate(testData, token)).toBe(false);
    });

    it('should fail validation if signature is missing', () => {
        const expiration = Math.floor(Date.now() / 1000 + 3600).toString();
        const token = `exp=${expiration}`;
        expect(tokenService.validate(testData, token)).toBe(false);
    });

    it('should fail validation if expiration is not a number', () => {
        const token = `exp=not_a_number&sig=abcdef123456`;
        expect(tokenService.validate(testData, token)).toBe(false);
    });

    it('should generate different tokens for different data', () => {
        const token1 = tokenService.sign('data1');
        const token2 = tokenService.sign('data2');
        expect(token1).not.toEqual(token2);
    });

    it('should generate different tokens for different secrets', () => {
        const token1 = tokenService.sign(testData);
        process.env.TOKEN_SECRET = 'another_secret';
        const tokenService2 = new TokenService();
        const token2 = tokenService2.sign(testData);
        expect(token1).not.toEqual(token2);
    });

    it('uses the fallback secret when TOKEN_SECRET is unset', () => {
        delete process.env.TOKEN_SECRET;
        const fallbackService = new TokenService();
        const token = fallbackService.sign(testData);

        expect(fallbackService.validate(testData, token)).toBe(true);
    });
});