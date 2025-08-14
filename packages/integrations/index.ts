import Twilio from 'twilio';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
}

export class TwilioService {
  private client: Twilio.Twilio;
  private fromNumber: string;

  constructor(config: TwilioConfig) {
    this.client = Twilio(config.accountSid, config.authToken);
    this.fromNumber = config.fromNumber;
  }

  async sendSMS(to: string, message: string): Promise<{ messageId: string; status: string }> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to,
      });
      return { messageId: result.sid, status: result.status };
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  async getMessageStatus(messageId: string): Promise<string> {
    try {
      const message = await this.client.messages(messageId).fetch();
      return message.status;
    } catch (error) {
      throw new Error(`Failed to get message status: ${error}`);
    }
  }
}

export class MailgunService {
  private mg: any;
  private domain: string;
  private fromEmail: string;

  constructor(config: MailgunConfig) {
    this.mg = mailgun.client({ username: 'api', key: config.apiKey });
    this.domain = config.domain;
    this.fromEmail = config.fromEmail;
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string
  ): Promise<{ messageId: string }> {
    try {
      const result = await this.mg.messages.create(this.domain, {
        from: this.fromEmail,
        to: [to],
        subject: subject,
        text: text,
        html: html,
        'o:tracking': 'yes',
        'o:tracking-clicks': 'yes',
        'o:tracking-opens': 'yes',
      });
      return { messageId: result.id };
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async getEmailEvents(messageId: string): Promise<any[]> {
    try {
      const events = await this.mg.events.get(this.domain, { 'message-id': messageId });
      return events.items;
    } catch (error) {
      throw new Error(`Failed to get email events: ${error}`);
    }
  }
}

export * from './types';