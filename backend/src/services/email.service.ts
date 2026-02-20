import nodemailer from 'nodemailer';
import config from '../config/env';
import NotificationLogModel from '../models/NotificationLog.model';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string, userId?: number): Promise<boolean> {
    try {
      // Log notification
      const log = await NotificationLogModel.create({
        user_id: userId,
        type: 'email',
        purpose: 'verification',
        content: `Subject: ${subject}`,
      });

      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });

      // Update log status
      await NotificationLogModel.updateStatus(log.id, 'sent');

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email error:', error);

      // Update log status
      const logs = await NotificationLogModel.findAll({ type: 'email', status: 'pending', limit: 1 });
      if (logs.length > 0) {
        await NotificationLogModel.updateStatus(logs[0].id, 'failed');
      }

      return false;
    }
  }

  async sendRegistrationConfirmation(email: string, name: string, interviewTitle: string, interviewDate: string, interviewTime: string, userId?: number): Promise<boolean> {
    const subject = 'Interview Registration Confirmation';
    const html = `
      <h2>Registration Confirmed</h2>
      <p>Dear ${name},</p>
      <p>Your registration for <strong>${interviewTitle}</strong> has been confirmed.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date: ${interviewDate}</li>
        <li>Time: ${interviewTime}</li>
      </ul>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>Good luck!</p>
    `;

    const log = await NotificationLogModel.create({
      user_id: userId,
      type: 'email',
      purpose: 'registration',
      content: `Registration confirmation for ${interviewTitle}`,
    });

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: email,
        subject,
        html,
      });

      await NotificationLogModel.updateStatus(log.id, 'sent');
      return true;
    } catch (error) {
      await NotificationLogModel.updateStatus(log.id, 'failed');
      console.error('Email error:', error);
      return false;
    }
  }

  async sendInterviewReminder(email: string, name: string, interviewTitle: string, interviewDate: string, interviewTime: string, location: string, userId?: number): Promise<boolean> {
    const subject = 'Interview Reminder';
    const html = `
      <h2>Interview Reminder</h2>
      <p>Dear ${name},</p>
      <p>This is a reminder that you have an interview scheduled for <strong>${interviewTitle}</strong>.</p>
      <p><strong>Interview Details:</strong></p>
      <ul>
        <li>Date: ${interviewDate}</li>
        <li>Time: ${interviewTime}</li>
        <li>Location: ${location || 'TBD'}</li>
      </ul>
      <p>Please arrive 10 minutes before your scheduled time.</p>
      <p>Good luck!</p>
    `;

    const log = await NotificationLogModel.create({
      user_id: userId,
      type: 'email',
      purpose: 'reminder',
      content: `Interview reminder for ${interviewTitle}`,
    });

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: email,
        subject,
        html,
      });

      await NotificationLogModel.updateStatus(log.id, 'sent');
      return true;
    } catch (error) {
      await NotificationLogModel.updateStatus(log.id, 'failed');
      console.error('Email error:', error);
      return false;
    }
  }

  async sendInterviewResult(email: string, name: string, interviewTitle: string, status: 'passed' | 'failed', score?: number, feedback?: string, userId?: number): Promise<boolean> {
    const subject = 'Interview Result';
    const statusColor = status === 'passed' ? '#52c41a' : '#ff4d4f';
    const html = `
      <h2>Interview Result</h2>
      <p>Dear ${name},</p>
      <p>Your interview for <strong>${interviewTitle}</strong> has been completed.</p>
      <p><strong>Result:</strong> <span style="color: ${statusColor}; font-weight: bold; font-size: 18px;">${status.toUpperCase()}</span></p>
      ${score !== undefined ? `<p><strong>Score:</strong> ${score}/100</p>` : ''}
      ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
      <p>Thank you for your participation!</p>
    `;

    const log = await NotificationLogModel.create({
      user_id: userId,
      type: 'email',
      purpose: 'result',
      content: `Interview result for ${interviewTitle}: ${status}`,
    });

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: email,
        subject,
        html,
      });

      await NotificationLogModel.updateStatus(log.id, 'sent');
      return true;
    } catch (error) {
      await NotificationLogModel.updateStatus(log.id, 'failed');
      console.error('Email error:', error);
      return false;
    }
  }
}

export default new EmailService();
