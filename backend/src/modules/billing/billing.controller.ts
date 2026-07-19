import { Request, Response } from 'express';
import { BillingService } from './billing.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';

export const getPlans = asyncHandler(async (req: Request, res: Response) => {
  const plans = BillingService.getPlans();
  return success(res, plans, 'Plans fetched');
});

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const subscription = await BillingService.getCurrentSubscription(tenantId);
  return success(res, subscription, 'Subscription fetched');
});

export const changePlan = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({ success: false, message: 'Plan is required' });
  }

  const result = await BillingService.changePlan(tenantId, plan);
  return success(res, result, 'Plan changed');
});

export const updateBillingEmail = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { email } = req.body;

  await BillingService.updateBillingEmail(tenantId, email);
  return success(res, { email }, 'Billing email updated');
});

export const checkUsage = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const limits = await BillingService.checkUsageLimits(tenantId);
  return success(res, limits, 'Usage limits checked');
});
