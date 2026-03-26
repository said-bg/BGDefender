import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import type { SentMessageInfo } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter<SentMessageInfo>;
  private emailTemplates: Record<string, string> = {};

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
    this.loadEmailTemplates();
  }

  /**
   * Load email templates from files
   */
  private loadEmailTemplates(): void {
    const templatesDir = path.join(__dirname, 'templates');
    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir);
      files.forEach((file) => {
        if (file.endsWith('.html')) {
          const filePath = path.join(templatesDir, file);
          const template = fs.readFileSync(filePath, 'utf-8');
          this.emailTemplates[file.replace('.html', '')] = template;
        }
      });
    }
  }

  /**
   * Get a template by name and language, replace variables, and inline CSS
   * @param templateName Template name (e.g., 'password-reset')
   * @param language Language code (e.g., 'en', 'fi')
   * @param variables Variables to replace in template
   * @returns HTML with inlined CSS
   */
  private getTemplate(
    templateName: string,
    language: string,
    variables: Record<string, string>,
  ): string {
    // Try to get language-specific template first, fallback to English
    const templateKey = `${templateName}.${language}`;
    let template =
      this.emailTemplates[templateKey] ||
      this.emailTemplates[`${templateName}.en`] ||
      '';

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), value);
    });

    // CSS in <head> is supported natively by Gmail/Outlook
    return template;
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
    language: string = 'en',
  ): Promise<void> {
    const fromEmail =
      process.env.SMTP_FROM ??
      process.env.SMTP_USER ??
      'noreply@bgdefender.com';

    // Get frontend URL for email links
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Get translated template with inlined CSS
    const htmlContent = this.getTemplate('password-reset', language, {
      RESET_LINK: resetLink,
      WEBSITE_URL: frontendUrl,
    });

    // Determine subject and text based on language
    const subjects: Record<string, string> = {
      en: 'Password Reset Request - BG Defender Academy',
      fi: 'Salasanan nollaus - BG Defender Academy',
    };

    const subject = subjects[language] || subjects.en;

    await this.transporter.sendMail({
      from: fromEmail,
      to: email,
      subject,
      html: htmlContent,
    });
  }
}
