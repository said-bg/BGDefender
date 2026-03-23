import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { SentMessageInfo } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter<SentMessageInfo>;

  constructor() {
    const smtpHost = process.env.SMTP_HOST ?? 'localhost';
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER ?? '';
    const smtpPass = process.env.SMTP_PASS ?? '';

    const transportOptions: SMTPTransport.Options = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth:
        smtpUser && smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
    };

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    const fromEmail =
      process.env.SMTP_FROM ??
      process.env.SMTP_USER ??
      'noreply@bgdefender.com';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>

            <p>Hi,</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can ignore this email.</p>

            <div class="footer">
              <p>© 2026 BGDefender. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: fromEmail,
      to: email,
      subject: 'Password Reset Request',
      html: htmlContent,
    });
  }
}
