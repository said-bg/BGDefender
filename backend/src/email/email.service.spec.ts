import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { EmailService } from './email.service';

jest.mock('fs');
jest.mock('nodemailer');

type MailOptions = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type SendMailFn = (options: MailOptions) => Promise<{ messageId: string }>;
type CreateTransportFn = (options: unknown) => { sendMail: SendMailFn };

describe('EmailService', () => {
  const mockedFs = jest.mocked(fs);
  const sendMail: jest.MockedFunction<SendMailFn> = jest.fn();
  const createTransport: jest.MockedFunction<CreateTransportFn> = jest.fn();

  const templatesDir = path.join(process.cwd(), 'src', 'email', 'templates');

  const passwordResetEnTemplate = `
    <a href="{{RESET_LINK}}">Reset My Password</a>
    <a href="{{WEBSITE_URL}}">Visit our website</a>
  `;

  const passwordResetFiTemplate = `
    <a href="{{RESET_LINK}}">Nollaa salasanani</a>
    <a href="{{WEBSITE_URL}}">Vieraile verkkosivullamme</a>
  `;

  const getSentMail = (): MailOptions => {
    expect(sendMail).toHaveBeenCalledTimes(1);
    return sendMail.mock.calls[0][0];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.FRONTEND_URL;

    sendMail.mockResolvedValue({ messageId: 'message-1' });
    createTransport.mockReturnValue({
      sendMail,
    });
    jest
      .spyOn(nodemailer, 'createTransport')
      .mockImplementation(
        createTransport as unknown as typeof nodemailer.createTransport,
      );

    mockedFs.existsSync.mockImplementation((value: fs.PathLike) => {
      return String(value).includes('templates');
    });
    mockedFs.readdirSync.mockImplementation((value: fs.PathLike) => {
      if (String(value) === templatesDir) {
        return ['password-reset.en.html', 'password-reset.fi.html'] as never[];
      }
      return [] as never[];
    });
    mockedFs.readFileSync.mockImplementation(
      (filePath: fs.PathOrFileDescriptor) => {
        const normalizedPath = String(filePath);

        if (normalizedPath.endsWith('password-reset.en.html')) {
          return passwordResetEnTemplate as never;
        }

        if (normalizedPath.endsWith('password-reset.fi.html')) {
          return passwordResetFiTemplate as never;
        }

        return '' as never;
      },
    );
  });

  it('creates an SMTP transporter with environment-based auth when credentials are provided', () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'mailer@example.com';
    process.env.SMTP_PASS = 'secret';

    new EmailService();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'mailer@example.com',
        pass: 'secret',
      },
    });
  });

  it('creates an SMTP transporter without auth when credentials are missing', () => {
    new EmailService();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 587,
      secure: false,
      auth: undefined,
    });
  });

  it('loads all html templates from disk during construction', () => {
    new EmailService();

    expect(mockedFs.existsSync).toHaveBeenCalledWith(templatesDir);
    expect(mockedFs.readdirSync).toHaveBeenCalledWith(templatesDir);
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      path.join(templatesDir, 'password-reset.en.html'),
      'utf-8',
    );
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      path.join(templatesDir, 'password-reset.fi.html'),
      'utf-8',
    );
  });

  it('sends an english password reset email with replaced template variables', async () => {
    process.env.SMTP_FROM = 'support@bgdefender.com';
    process.env.FRONTEND_URL = 'https://bgdefender.example';
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
    );

    // This checks the user-visible email content, not just that sendMail was called.
    const mail = getSentMail();

    expect(mail.from).toBe('support@bgdefender.com');
    expect(mail.to).toBe('learner@example.com');
    expect(mail.subject).toBe('Password Reset Request - BG Defender Academy');
    expect(mail.html).toContain('https://bgdefender.example/reset?token=abc');
    expect(mail.html).toContain('https://bgdefender.example');
    expect(mail.html).not.toContain('{{RESET_LINK}}');
  });

  it('uses the finnish template and subject when language is fi', async () => {
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
      'fi',
    );

    const mail = getSentMail();

    expect(mail.subject).toBe('Salasanan nollaus - BG Defender Academy');
    expect(mail.html).toContain('Nollaa salasanani');
  });

  it('falls back to the english template and subject when the language is unsupported', async () => {
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
      'de',
    );

    const mail = getSentMail();

    expect(mail.subject).toBe('Password Reset Request - BG Defender Academy');
    expect(mail.html).toContain('Reset My Password');
  });

  it('falls back to SMTP_USER as sender when SMTP_FROM is not defined', async () => {
    process.env.SMTP_USER = 'mailer@example.com';
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
    );

    const mail = getSentMail();

    expect(mail.from).toBe('mailer@example.com');
  });

  it('falls back to the default sender and localhost frontend url when env vars are missing', async () => {
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
    );

    const mail = getSentMail();

    expect(mail.from).toBe('noreply@bgdefender.com');
    expect(mail.html).toContain('http://localhost:3000');
  });

  it('keeps an empty template when the template directory does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const service = new EmailService();

    await service.sendPasswordResetEmail(
      'learner@example.com',
      'https://bgdefender.example/reset?token=abc',
    );

    expect(mockedFs.readdirSync).not.toHaveBeenCalled();
    expect(getSentMail().html).toBe('');
  });
});
