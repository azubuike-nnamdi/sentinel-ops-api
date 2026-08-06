import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const host = this.configService.get<string>('mail.host') || '';
    const port = this.configService.get<number>('mail.port') || 25;
    const insecureTls =
      this.configService.get<boolean>('mail.insecureTls') ?? true;
    const authMode = this.configService.get<string>('mail.authMode') || 'null';

    if (!host) {
      this.logger.warn('SMTP_HOST not configured — invitation emails will fail');
      return;
    }

    const transportOptions: {
      host: string;
      port: number;
      secure: boolean;
      auth?: { user: string; pass: string };
      tls?: { rejectUnauthorized: boolean };
    } = {
      host,
      port,
      secure: port === 465,
    };

    if (insecureTls) {
      transportOptions.tls = { rejectUnauthorized: false };
      this.logger.warn(
        'SMTP_INSECURE_TLS enabled — SMTP certificate validation is disabled',
      );
    }

    if (authMode && !['null', 'false', 'none'].includes(authMode)) {
      const user = this.configService.get<string>('mail.user') || '';
      const password = this.configService.get<string>('mail.password') || '';
      if (user && password) {
        transportOptions.auth = { user, pass: password };
      } else {
        this.logger.warn(
          'MAIL_AUTH enabled but SMTP_USER/SMTP_PASSWORD missing — emails disabled',
        );
        return;
      }
    } else {
      this.logger.log(
        'MAIL_AUTH disabled — connecting to SMTP without authentication',
      );
    }

    this.transporter = createTransport(transportOptions);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP transporter is not configured');
    }

    const fromAddress = this.configService.get<string>('mail.from') || '';
    const senderName =
      this.configService.get<string>('mail.senderName') || 'Sentinel Ops';

    await this.transporter.sendMail({
      from: `"${senderName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
