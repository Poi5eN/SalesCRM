import { Request, Response } from 'express';
import { CommentService } from './comment.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId = req.user!.id;
  const { entityType, entityId, body, mentions } = req.body;

  if (!entityType || !entityId || !body) {
    return res.status(400).json({ success: false, message: 'entityType, entityId, and body are required' });
  }

  const comment = await CommentService.addComment({ tenantId, userId, entityType, entityId, body, mentions });
  return success(res, comment, 'Comment added');
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const entityType = req.params.entityType as string;
  const entityId = req.params.entityId as string;

  const comments = await CommentService.getComments(tenantId, entityType, entityId);
  return success(res, comments, 'Comments fetched');
});
