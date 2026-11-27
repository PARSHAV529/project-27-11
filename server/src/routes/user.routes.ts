import { Router } from 'express';
import {
  listUsers,
  listUsersQuerySchema,
  updateUserRole,
  updateUserRoleSchema,
  userIdParamSchema,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate, validateParams, validateQuery } from '../middleware/validate.js';

const userRouter = Router();

userRouter.use(authenticate, authorize('admin'));

userRouter.get('/', validateQuery(listUsersQuerySchema), listUsers);
userRouter.patch(
  '/:id/role',
  validateParams(userIdParamSchema),
  validate(updateUserRoleSchema),
  updateUserRole,
);

export default userRouter;
