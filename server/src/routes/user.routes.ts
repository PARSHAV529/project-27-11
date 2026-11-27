import { Router } from 'express';
import {
  listUsers,
  updateUserRole,
  updateUserRoleSchema,
  userIdParamSchema,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate, validateParams } from '../middleware/validate.js';

const userRouter = Router();

userRouter.use(authenticate, authorize('admin'));

userRouter.get('/', listUsers);
userRouter.patch(
  '/:id/role',
  validateParams(userIdParamSchema),
  validate(updateUserRoleSchema),
  updateUserRole,
);

export default userRouter;
