import type { Request, Response } from 'express';
import { TaskService } from './task.service.ts';
import { success } from '@/utils/response.ts';

export class TaskController {
  static list = async (req: Request, res: Response) => {
    const result = await TaskService.listTasks(req.user!.tenantId, req.query);
    return success(res, result, 'Tasks fetched successfully');
  };

  static create = async (req: Request, res: Response) => {
    const task = await TaskService.createTask(req.user!.tenantId, req.user!.id, req.body);
    return success(res, task, 'Task created successfully', 201);
  };

  static get = async (req: Request, res: Response) => {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id as string, tenantId: req.user!.tenantId, deletedAt: null }
    });
    if (!task) throw { status: 404, message: 'Task not found' };
    return success(res, task, 'Task details fetched successfully');
  };

  static update = async (req: Request, res: Response) => {
    const task = await TaskService.updateTask(req.user!.tenantId, req.params.id as string, req.body);
    return success(res, task, 'Task updated successfully');
  };

  static delete = async (req: Request, res: Response) => {
    await TaskService.updateTask(req.user!.tenantId, req.params.id as string, { deletedAt: new Date() });
    return success(res, null, 'Task deleted successfully');
  };

  static getUpcoming = async (req: Request, res: Response) => {
    const result = await TaskService.getUpcoming(req.user!.tenantId, req.user!.id);
    return success(res, result, 'Upcoming tasks fetched successfully');
  };

  static getOverdue = async (req: Request, res: Response) => {
    const result = await TaskService.getOverdue(req.user!.tenantId, req.user!.id);
    return success(res, result, 'Overdue tasks fetched successfully');
  };
}

import prisma from '@/config/database.ts';
