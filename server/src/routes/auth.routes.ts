import { Router } from 'express';
import { getMe, login, loginSchema, signup, signupSchema } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginLimiter, signupLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';

const authRouter = Router();

authRouter.post('/signup', signupLimiter, validate(signupSchema), signup);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
authRouter.get('/me', authenticate, getMe);

export default authRouter;
