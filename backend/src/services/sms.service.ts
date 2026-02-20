import Dysmsapi from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import config from '../config/env';
import NotificationLogModel from '../models/NotificationLog.model';

class SMSService {
  private client?: Dysmsapi;

  constructor() {
    if (config.sms.accessKeyId && config.sms.accessKeySecret) {
      const configSMS = new OpenApi.Config({
        accessKeyId: config.sms.accessKeyId,
        accessKeySecret: config.sms.accessKeySecret,
      });
      configSMS.endpoint = 'dysmsapi.aliyuncs.com';
      this.client = new Dysmsapi(configSMS);
    } else {
      console.warn('SMS credentials not configured, SMS service will be disabled');
    }
  }

  async sendSMS(phoneNumber: string, code: string, userId?: number): Promise<boolean> {
    if (!this.client) {
      console.warn('SMS service not configured');
      return false;
    }

    try {
      const log = await NotificationLogModel.create({
        user_id: userId,
        type: 'sms',
        purpose: 'verification',
        content: `SMS to ${phoneNumber}`,
      });

      const request = {
        phoneNumbers: phoneNumber,
        signName: config.sms.signName,
        templateCode: config.sms.templateCode,
        templateParam: JSON.stringify({ code }),
      };

      const response = await this.client.sendSms(request as any);

      if (response.body?.code === 'OK') {
        await NotificationLogModel.updateStatus(log.id, 'sent');
        console.log('SMS sent successfully');
        return true;
      } else {
        await NotificationLogModel.updateStatus(log.id, 'failed');
        console.error('SMS failed:', response.body?.message);
        return false;
      }
    } catch (error) {
      console.error('SMS error:', error);
      const logs = await NotificationLogModel.findAll({ type: 'sms', status: 'pending', limit: 1 });
      if (logs.length > 0) {
        await NotificationLogModel.updateStatus(logs[0].id, 'failed');
      }
      return false;
    }
  }

  async sendRegistrationSMS(phoneNumber: string, name: string, interviewTitle: string, interviewDate: string): Promise<boolean> {
    if (!this.client) {
      console.warn('SMS service not configured');
      return false;
    }

    try {
      const log = await NotificationLogModel.create({
        type: 'sms',
        purpose: 'registration',
        content: `Registration confirmation to ${phoneNumber}`,
      });

      const request = {
        phoneNumbers: phoneNumber,
        signName: config.sms.signName,
        templateCode: config.sms.templateCode,
        templateParam: JSON.stringify({ name, interview: interviewTitle, date: interviewDate }),
      };

      const response = await this.client.sendSms(request as any);

      if (response.body?.code === 'OK') {
        await NotificationLogModel.updateStatus(log.id, 'sent');
        return true;
      } else {
        await NotificationLogModel.updateStatus(log.id, 'failed');
        return false;
      }
    } catch (error) {
      console.error('SMS error:', error);
      return false;
    }
  }

  async sendReminderSMS(phoneNumber: string, name: string, interviewTime: string): Promise<boolean> {
    if (!this.client) {
      console.warn('SMS service not configured');
      return false;
    }

    try {
      const log = await NotificationLogModel.create({
        type: 'sms',
        purpose: 'reminder',
        content: `Reminder to ${phoneNumber}`,
      });

      const request = {
        phoneNumbers: phoneNumber,
        signName: config.sms.signName,
        templateCode: config.sms.templateCode,
        templateParam: JSON.stringify({ name, time: interviewTime }),
      };

      const response = await this.client.sendSms(request as any);

      if (response.body?.code === 'OK') {
        await NotificationLogModel.updateStatus(log.id, 'sent');
        return true;
      } else {
        await NotificationLogModel.updateStatus(log.id, 'failed');
        return false;
      }
    } catch (error) {
      console.error('SMS error:', error);
      return false;
    }
  }
}

export default new SMSService();
