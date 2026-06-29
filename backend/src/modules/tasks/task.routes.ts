import { Router } from 'express';
import { TaskController } from './task.controller.js';
import validate from '@/middleware/validate.js';
import authGuard from '@/middleware/authGuard.js';
import asyncHandler from '@/utils/asyncHandler.js';
import { 
  createTaskSchema, 
  updateTaskSchema, 
  taskFilterSchema 
} from './task.schemas.js';

const router = Router();

router.use(authGuard);

router.get('/', validate(taskFilterSchema), asyncHandler(TaskController.list));
router.post('/', validate(createTaskSchema), asyncHandler(TaskController.create));

router.get('/upcoming', asyncHandler(TaskController.getUpcoming));
router.get('/overdue', asyncHandler(TaskController.getOverdue));

router.get('/:id', asyncHandler(TaskController.get));
router.patch('/:id', validate(updateTaskSchema), asyncHandler(TaskController.update));
router.delete('/:id', asyncHandler(TaskController.delete));

export default router;
