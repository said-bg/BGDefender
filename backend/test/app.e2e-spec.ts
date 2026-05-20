import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Server } from 'http';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { EmailService } from './../src/email/email.service';
import type { SafeUser } from './../src/auth/types/safe-user.type';

type LoginResponse = { user: SafeUser };
type ErrorResponse = { message: string };
type SuccessResponse = { message: string };
const TEST_EMAIL_PATTERN = '%@example.com';

const getAuthCookieHeader = (setCookieHeader: string[] | undefined): string => {
  const authCookie = setCookieHeader?.find((cookie) =>
    cookie.startsWith('bg_defender_auth='),
  );

  if (!authCookie) {
    throw new Error('Expected auth cookie to be set');
  }

  return authCookie.split(';')[0];
};

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let httpServer: Server;
  let dataSource: DataSource;
  let mockEmailService: { sendPasswordResetEmail: jest.Mock };

  const cleanupTestData = async () => {
    await dataSource.query(
      `
        DELETE answer
        FROM quiz_attempt_answers answer
        INNER JOIN quiz_attempts attempt ON answer.attemptId = attempt.id
        INNER JOIN users user ON attempt.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE attempt
        FROM quiz_attempts attempt
        INNER JOIN users user ON attempt.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE certificate
        FROM certificates certificate
        INNER JOIN users user ON certificate.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE progress_entry
        FROM progress progress_entry
        INNER JOIN users user ON progress_entry.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE favorite
        FROM favorites favorite
        INNER JOIN users user ON favorite.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE notification
        FROM notifications notification
        INNER JOIN users user ON notification.userId = user.id
        WHERE user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      `
        DELETE resource
        FROM resources resource
        LEFT JOIN users assigned_user ON resource.assignedUserId = assigned_user.id
        LEFT JOIN users created_by_user ON resource.createdByUserId = created_by_user.id
        WHERE assigned_user.email LIKE ? OR created_by_user.email LIKE ?
      `,
      [TEST_EMAIL_PATTERN, TEST_EMAIL_PATTERN],
    );

    await dataSource.query(
      'DELETE FROM password_reset_tokens WHERE email LIKE ?',
      [TEST_EMAIL_PATTERN],
    );

    await dataSource.query('DELETE FROM users WHERE email LIKE ?', [TEST_EMAIL_PATTERN]);
  };

  beforeAll(async () => {
    process.env.DISABLE_RATE_LIMIT = 'true';

    mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        ...mockEmailService,
        sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    httpServer = app.getHttpServer() as Server;
    dataSource = app.get(DataSource);
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
    delete process.env.DISABLE_RATE_LIMIT;
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: `test-${Date.now()}@example.com`,
        password: 'Password123',
      };

      const response = await request(httpServer)
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const user = response.body as SafeUser;
      expect(user.id).toBeDefined();
      expect(user.email).toBe(registerDto.email);
      expect(user.role).toBe('USER');
      expect(user.plan).toBe('FREE');
      expect(user.isActive).toBe(true);
      expect(user).not.toHaveProperty('password');
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await request(httpServer)
        .post('/auth/register')
        .send({ email, password: 'Password123' })
        .expect(201);

      // Second registration with same email
      const response = await request(httpServer)
        .post('/auth/register')
        .send({ email, password: 'Password123' })
        .expect(409);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `short-pwd-${Date.now()}@example.com`,
          password: 'Pass1',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject password without uppercase letter', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `no-upper-${Date.now()}@example.com`,
          password: 'password123',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject password without number', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: `no-num-${Date.now()}@example.com`,
          password: 'PasswordABC',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const response = await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    let testEmail: string;
    const testPassword = 'Password123';

    beforeAll(async () => {
      testEmail = `login-test-${Date.now()}@example.com`;

      await request(httpServer)
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(201);
    });

    it('should login successfully and set the auth cookie', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      const loginResponse = response.body as LoginResponse;
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('bg_defender_auth=')]),
      );
      expect(loginResponse.user).toBeDefined();
      expect(loginResponse.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: 'WrongPassword123' })
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'Password123',
        })
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should return user data in login response', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect(200);

      const loginResponse = response.body as LoginResponse;
      expect(loginResponse.user.email).toBe(testEmail);
      expect(loginResponse.user.role).toBe('USER');
      expect(loginResponse.user.plan).toBe('FREE');
    });
  });

  describe('GET /auth/me', () => {
    let authCookie: string;

    beforeAll(async () => {
      const email = `me-test-${Date.now()}@example.com`;

      // 1️⃣ CRÉER le user d'abord
      await request(httpServer)
        .post('/auth/register')
        .send({ email, password: 'Password123' })
        .expect(201);

      // 2️⃣ PUIS login pour obtenir le token
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({ email, password: 'Password123' })
        .expect(200);

      authCookie = getAuthCookieHeader(loginResponse.headers['set-cookie']);
    });

    it('should return current user with valid auth cookie', async () => {
      const response = await request(httpServer)
        .get('/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      const user = response.body as SafeUser;
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBe('USER');
      expect(user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(httpServer).get('/auth/me').expect(401);
      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject request with invalid token', async () => {
      const response = await request(httpServer)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(httpServer)
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    let registeredEmail: string;

    beforeAll(async () => {
      registeredEmail = `forgot-pwd-${Date.now()}@example.com`;

      await request(httpServer)
        .post('/auth/register')
        .send({ email: registeredEmail, password: 'Password123' })
        .expect(201);
    });

    it('should return 200 for valid email (success message does not reveal if email exists)', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: registeredEmail })
        .expect(200);

      const successResponse = response.body as SuccessResponse;
      expect(successResponse.message).toBeDefined();
    });

    it('should return 200 even for non-existent email (security: do not reveal)', async () => {
      // Verify email is NOT sent for non-existent email
      const callCountBefore =
        mockEmailService.sendPasswordResetEmail.mock.calls.length;

      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      const successResponse = response.body as SuccessResponse;
      expect(successResponse.message).toBeDefined();

      // Verify no email was sent (call count should not increase)
      const callCountAfter =
        mockEmailService.sendPasswordResetEmail.mock.calls.length;
      expect(callCountAfter).toBe(callCountBefore);
    });

    it('should reject invalid email format', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject missing email', async () => {
      const response = await request(httpServer)
        .post('/auth/forgot-password')
        .send({})
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });
  });

  describe('POST /auth/reset-password', () => {
    let registeredEmail: string;

    beforeAll(async () => {
      registeredEmail = `reset-pwd-${Date.now()}@example.com`;

      await request(httpServer)
        .post('/auth/register')
        .send({ email: registeredEmail, password: 'Password123' })
        .expect(201);
    });

    it('should successfully reset password with valid token', async () => {
      const testEmail = `reset-success-${Date.now()}@example.com`;
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      // 1. Register user
      await request(httpServer)
        .post('/auth/register')
        .send({ email: testEmail, password: oldPassword })
        .expect(201);

      // 2. Request password reset (this calls sendPasswordResetEmail)
      await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // 3. Capture the resetLink from the mock
      const callsBeforeAssertion =
        mockEmailService.sendPasswordResetEmail.mock.calls as unknown[][];
      const matchingCall = callsBeforeAssertion.find(
        (call) => call[0] === testEmail,
      );

      expect(matchingCall).toBeDefined();
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.stringContaining('token='),
        'en',
      );

      // Get the calls from the mock - type assertion for safety
      const lastCall = matchingCall as [string, string, string];
      const resetLink = lastCall[1];
      expect(resetLink).toBeDefined();

      // 4. Extract token from URL (format: http://localhost:3000/reset-password?token=abc123)
      const tokenMatch = resetLink.match(/token=([a-f0-9]+)/);
      expect(tokenMatch).toBeDefined();
      const resetToken = tokenMatch?.[1];
      expect(resetToken).toBeTruthy();

      // 5. Reset password with the captured token
      const resetResponse = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(200);

      const resetBody = resetResponse.body as { message: string };
      expect(resetBody.message).toBeDefined();

      // 6. Verify old password no longer works
      await request(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: oldPassword })
        .expect(401);

      // 7. Verify new password works
      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({ email: testEmail, password: newPassword })
        .expect(200);

      expect(loginResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('bg_defender_auth=')]),
      );
      const loginBody = loginResponse.body as LoginResponse;
      expect(loginBody.user.email).toBe(testEmail);
    });

    it('should verify sendPasswordResetEmail was called for valid email', async () => {
      mockEmailService.sendPasswordResetEmail.mockClear();

      const testEmail = `verify-email-call-${Date.now()}@example.com`;

      // Register
      await request(httpServer)
        .post('/auth/register')
        .send({ email: testEmail, password: 'Password123' })
        .expect(201);

      // Request forgot password
      await request(httpServer)
        .post('/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      // Verify email was called
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testEmail,
        expect.any(String),
        'en',
      );
    });

    it('should reject invalid reset token', async () => {
      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token-that-does-not-exist',
          newPassword: 'NewPassword123',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject new password that is too short', async () => {
      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'any-token',
          newPassword: 'Short1',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject new password without uppercase', async () => {
      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'any-token',
          newPassword: 'lowercaseonly123',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject new password without number', async () => {
      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({
          token: 'any-token',
          newPassword: 'NoNumberPassword',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });

    it('should reject missing token or newPassword', async () => {
      const response = await request(httpServer)
        .post('/auth/reset-password')
        .send({})
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.message).toBeDefined();
    });
  });
});
