import { body } from 'express-validator'

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),

  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['wholesaler', 'salesman', 'retailer']).withMessage('Role must be wholesaler, salesman, or retailer.'),

  body('businessName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Business name must be under 100 characters.'),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s\-]{7,15}$/).withMessage('Enter a valid phone number.'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('City must be under 60 characters.'),
]

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  body('role')
    .notEmpty().withMessage('Role is required.')
    .isIn(['admin', 'wholesaler', 'salesman', 'retailer']).withMessage('Invalid role selected.'),
]
