import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Validation schemas
export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters',
      'any.required': 'Name is required',
    }),
    verification_code: Joi.string().length(6).required().messages({
      'string.length': 'Verification code must be 6 digits',
      'any.required': 'Verification code is required',
    }),
    phone: Joi.string().pattern(/^[0-9+\-\s()]*$/).optional(),
    student_id: Joi.string().max(50).optional(),
    major: Joi.string().max(100).optional(),
    grade: Joi.string().max(20).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),

  sendVerification: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    type: Joi.string().valid('register', 'reset_password', 'login').required(),
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().length(6).required(),
    new_password: Joi.string().min(6).required(),
  }),

  changePassword: Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().min(6).required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]*$/).allow(null).optional(),
    student_id: Joi.string().max(50).allow(null).optional(),
    major: Joi.string().max(100).allow(null).optional(),
    grade: Joi.string().max(20).allow(null).optional(),
  }),

  createInterview: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().max(2000).optional().allow(''),
    position: Joi.string().min(2).max(100).required(),
    department: Joi.string().max(100).optional().allow(null),
    location: Joi.string().max(200).optional().allow(null),
    interview_date: Joi.date().iso().required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    capacity: Joi.number().integer().min(1).required(),
    requirements: Joi.string().max(2000).optional().allow(''),
  }),

  updateInterview: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    position: Joi.string().min(2).max(100).optional(),
    department: Joi.string().max(100).optional().allow(null),
    location: Joi.string().max(200).optional().allow(null),
    interview_date: Joi.date().iso().optional(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    requirements: Joi.string().max(2000).optional().allow(''),
    status: Joi.string().valid('draft', 'published', 'closed', 'completed').optional(),
  }),

  createRegistration: Joi.object({
    interview_id: Joi.number().integer().required(),
    slot_id: Joi.number().integer().optional().allow(null),
    resume_url: Joi.string().uri().optional().allow(null),
    answers: Joi.object().optional().allow(null),
    notes: Joi.string().max(1000).optional().allow(''),
  }),

  scoreRegistration: Joi.object({
    score: Joi.number().integer().min(0).max(100).required(),
    feedback: Joi.string().max(2000).optional().allow(''),
  }),

  updateRegistrationStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'confirmed', 'cancelled', 'completed', 'failed', 'no_show')
      .required(),
  }),

  createQuestion: Joi.object({
    category: Joi.string().min(2).max(100).required(),
    question: Joi.string().min(5).max(1000).required(),
    answer: Joi.string().max(2000).optional().allow(''),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional().allow(null),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  updateQuestion: Joi.object({
    category: Joi.string().min(2).max(100).optional(),
    question: Joi.string().min(5).max(1000).optional(),
    answer: Joi.string().max(2000).optional().allow(''),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional().allow(null),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  createClassroom: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    location: Joi.string().max(200).optional().allow(null, ''),
    capacity: Joi.number().integer().min(1).required(),
    equipment: Joi.array().items(Joi.string()).optional(),
    is_available: Joi.boolean().optional(),
  }),

  updateClassroom: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    location: Joi.string().max(200).optional().allow(null, ''),
    capacity: Joi.number().integer().min(1).optional(),
    equipment: Joi.array().items(Joi.string()).optional(),
    is_available: Joi.boolean().optional(),
  }),

  createSlot: Joi.object({
    classroom_id: Joi.number().integer().optional().allow(null),
    date: Joi.date().iso().required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    capacity: Joi.number().integer().min(1).required(),
    interviewer_ids: Joi.array().items(Joi.number().integer()).optional(),
  }),

  updateSlot: Joi.object({
    classroom_id: Joi.number().integer().optional().allow(null),
    date: Joi.date().iso().optional(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    interviewer_ids: Joi.array().items(Joi.number().integer()).optional(),
  }),

  createResource: Joi.object({
    title: Joi.string().min(2).max(200).required(),
    description: Joi.string().max(1000).optional().allow(''),
    url: Joi.string().uri().optional().allow(null),
    type: Joi.string().valid('article', 'video', 'document').required(),
    category: Joi.string().max(100).optional().allow(null),
  }),
};
