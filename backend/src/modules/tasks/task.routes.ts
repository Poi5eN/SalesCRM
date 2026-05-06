import { Router } from 'express';
import { TaskController } from './task.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createTaskSchema, 
  updateTaskSchema, 
  taskFilterSchema 
} from './task.schemas.ts';

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
