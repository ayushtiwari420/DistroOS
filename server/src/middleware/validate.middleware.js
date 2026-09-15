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
]

export const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must have at least one item.'),
  body('items.*.productId')
    .notEmpty().withMessage('Each item must have a valid productId.')
    .isMongoId().withMessage('Invalid product ID format.'),
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Item quantity must be a positive integer.'),
  body('paymentType')
    .optional()
    .isIn(['cash', 'credit', 'upi']).withMessage('Payment type must be cash, credit, or upi.'),
]

export const validateCreateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required.')
    .isLength({ min: 2, max: 120 }).withMessage('Product name must be 2–120 characters.'),
  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.'),
  body('costPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Cost price must be a non-negative number.'),
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer.'),
]

export const validateRepayment = [
  body('amount')
    .notEmpty().withMessage('Repayment amount is required.')
    .isFloat({ min: 1 }).withMessage('Repayment amount must be at least ₹1.'),
]
