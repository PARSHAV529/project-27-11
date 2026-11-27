import { Router } from 'express';
import { getMe, login, loginSchema, signup, signupSchema } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
// Temporarily disabled due to Vercel deployment TS2349 error on express-rate-limit types.
// import { loginLimiter, signupLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';

const authRouter = Router();

authRouter.post('/signup', validate(signupSchema), signup);
authRouter.post('/login', validate(loginSchema), login);
authRouter.get('/me', authenticate, getMe);

export default authRouter;
