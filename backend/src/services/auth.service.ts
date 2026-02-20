import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/env';
import UserModel from '../models/User.model';
import RefreshTokenModel from '../models/RefreshToken.model';
import VerificationCodeModel from '../models/VerificationCode.model';
import EmailService from './email.service';
import { UserWithoutPassword, AuthResponse, RegisterData, LoginCredentials, AccessTokenPayload, RefreshTokenPayload } from '../types';

class AuthService {
  private SALT_ROUNDS = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateAccessToken(user: UserWithoutPassword): string {
    const payload: AccessTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiry as jwt.SignOptions['expiresIn'],
    });
  }

  async generateRefreshToken(user: UserWithoutPassword): Promise<{ token: string; expiresAt: string }> {
    const payload: RefreshTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
    };
    const token = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiry as jwt.SignOptions['expiresIn'],
    });

    // Calculate expiration date
    const expiresAt = new Date();
    const match = config.jwt.refreshExpiry.match(/(\d+)([dhms])/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    }

    // Store refresh token in database
    await RefreshTokenModel.create({
      user_id: user.id,
      token,
      expiresAt: expiresAt.toISOString(),
    });

    return { token, expiresAt: expiresAt.toISOString() };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Verify verification code
    const isValid = await VerificationCodeModel.verifyCode(data.email, data.verification_code, 'register');
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password);

    // Create user
    const user = await UserModel.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      student_id: data.student_id,
      major: data.major,
      grade: data.grade,
    });

    // Mark user as verified
    await UserModel.setVerified(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken } = await this.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await UserModel.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await this.comparePassword(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Return user without password
    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      student_id: user.student_id,
      major: user.major,
      grade: user.grade,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Generate tokens
    const accessToken = this.generateAccessToken(userWithoutPassword);
    const { token: refreshToken } = await this.generateRefreshToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshTokenPayload;

    // Check if refresh token exists in database and is valid
    const isValid = await RefreshTokenModel.isValid(refreshToken);
    if (!isValid) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    // Delete refresh token from database
    await RefreshTokenModel.deleteByToken(refreshToken);
  }

  async logoutAll(userId: number): Promise<void> {
    // Delete all refresh tokens for user
    await RefreshTokenModel.deleteAllForUser(userId);
  }

  async sendVerificationCode(email: string, type: 'register' | 'reset_password' | 'login'): Promise<void> {
    // Invalidate previous codes
    await VerificationCodeModel.invalidatePreviousCodes(email, type);

    // Generate new code
    const code = VerificationCodeModel.generateCode();

    // Calculate expiration (5 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Store in database
    await VerificationCodeModel.create({
      email,
      code,
      type,
      expiresAt: expiresAt.toISOString(),
    });

    // Send email
    let subject = '';
    let html = '';

    switch (type) {
      case 'register':
        subject = 'Interview System - Registration Verification Code';
        html = `
          <h2>Welcome to Interview System</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #1677ff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
        break;
      case 'reset_password':
        subject = 'Interview System - Password Reset Code';
        html = `
          <h2>Password Reset Request</h2>
          <p>Your password reset code is:</p>
          <h1 style="color: #1677ff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
        break;
      case 'login':
        subject = 'Interview System - Login Verification Code';
        html = `
          <h2>Login Verification Code</h2>
          <p>Your login verification code is:</p>
          <h1 style="color: #1677ff; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
        break;
    }

    await EmailService.sendEmail(email, subject, html);
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    // Verify code
    const isValid = await VerificationCodeModel.verifyCode(email, code, 'reset_password');
    if (!isValid) {
      throw new Error('Invalid or expired verification code');
    }

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await UserModel.updatePassword(user.id, hashedPassword);

    // Invalidate all refresh tokens
    await RefreshTokenModel.deleteAllForUser(user.id);
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    // Get user
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get full user with password
    const userWithPassword = await UserModel.findByEmail(user.email);
    if (!userWithPassword) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValid = await this.comparePassword(oldPassword, userWithPassword.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await UserModel.updatePassword(userId, hashedPassword);

    // Invalidate all refresh tokens
    await RefreshTokenModel.deleteAllForUser(userId);
  }
}

export default new AuthService();
