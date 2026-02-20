// User types
export type UserRole = 'user' | 'admin' | 'interviewer';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  student_id?: string;
  major?: string;
  grade?: string;
  is_verified: number;
  created_at: string;
  updated_at: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

// Interview types
export type InterviewStatus = 'draft' | 'published' | 'closed' | 'completed';

export interface Interview {
  id: number;
  title: string;
  description?: string;
  position: string;
  department?: string;
  location?: string;
  interview_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  requirements?: string;
  status: InterviewStatus;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewWithDetails extends Interview {
  creator?: UserWithoutPassword;
  registered_count?: number;
}

// Interview Slot types
export interface InterviewSlot {
  id: number;
  interview_id: number;
  classroom_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  interviewer_ids?: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewSlotWithDetails extends InterviewSlot {
  classroom?: Classroom;
  interviewers?: UserWithoutPassword[];
}

// Registration types
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'failed' | 'no_show';

export interface Registration {
  id: number;
  user_id: number;
  interview_id: number;
  slot_id?: number;
  status: RegistrationStatus;
  resume_url?: string;
  answers?: string;
  notes?: string;
  interview_score?: number;
  interview_feedback?: string;
  result_announced: number;
  interview_time?: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationWithDetails extends Registration {
  user?: UserWithoutPassword;
  interview?: Interview;
  slot?: InterviewSlotWithDetails;
}

// Verification Code types
export type VerificationCodeType = 'register' | 'reset_password' | 'login';

export interface VerificationCode {
  id: number;
  email: string;
  code: string;
  type: VerificationCodeType;
  expires_at: string;
  used: number;
  created_at: string;
}

// Question Bank types
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBank {
  id: number;
  category: string;
  question: string;
  answer?: string;
  difficulty?: QuestionDifficulty;
  tags?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionBankWithCreator extends QuestionBank {
  creator?: UserWithoutPassword;
}

// Classroom types
export interface Classroom {
  id: number;
  name: string;
  location?: string;
  capacity: number;
  equipment?: string;
  is_available: number;
  created_at: string;
  updated_at: string;
}

// Learning Resource types
export type ResourceType = 'article' | 'video' | 'document';

export interface LearningResource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  type: ResourceType;
  category?: string;
  created_at: string;
}

// Notification Log types
export type NotificationType = 'email' | 'sms';
export type NotificationPurpose = 'registration' | 'reminder' | 'result' | 'verification' | 'reset_password';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationLog {
  id: number;
  user_id?: number;
  type: NotificationType;
  purpose: NotificationPurpose;
  content?: string;
  status: NotificationStatus;
  sent_at?: string;
  created_at: string;
}

// Refresh Token types
export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

// JWT Payload types
export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AccessTokenPayload extends JwtPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  type: 'refresh';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  verification_code: string;
  phone?: string;
  student_id?: string;
  major?: string;
  grade?: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

// Registration create types
export interface CreateRegistrationData {
  interview_id: number;
  slot_id?: number;
  resume_url?: string;
  answers?: Record<string, any>;
}
