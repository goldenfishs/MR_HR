import { Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { AccessTokenPayload } from '../types';

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, verification_code, phone, student_id, major, grade } = req.body;

      const result = await AuthService.register({
        email,
        password,
        name,
        verification_code,
        phone,
        student_id,
        major,
        grade,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const refreshToken = req.body.refresh_token;

      if (refreshToken) {
        await AuthService.logout(userId, refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      await AuthService.logoutAll(userId);

      res.status(200).json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await AuthService.refreshAccessToken(refresh_token);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  }

  async sendVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email, type } = req.body;

      await AuthService.sendVerificationCode(email, type);

      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, new_password } = req.body;

      await AuthService.resetPassword(email, code, new_password);

      res.status(200).json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const { old_password, new_password } = req.body;

      await AuthService.changePassword(userId, old_password, new_password);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AccessTokenPayload).userId;
      const UserModel = (await import('../models/User.model')).default;
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user data',
      });
    }
  }
}

export default new AuthController();
