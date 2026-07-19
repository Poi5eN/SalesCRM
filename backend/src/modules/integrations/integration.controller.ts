import { Request, Response } from 'express';
import { IntegrationService } from './integration.service.js';
import { success } from '@/utils/response.js';
import asyncHandler from '@/utils/asyncHandler.js';

export const getIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const config = await IntegrationService.getConfig(tenantId);
  return success(res, config, 'Integration config fetched');
});

export const updateIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { whatsapp, googleCalendar, emailSync } = req.body;
  const result = await IntegrationService.updateConfig(tenantId, { whatsapp, googleCalendar, emailSync });
  return success(res, result, 'Integration config updated');
});

export const verifyWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { verificationToken } = req.body;
  const verified = await IntegrationService.verifyWhatsAppWebhook(tenantId, verificationToken);
  return success(res, { verified }, verified ? 'WhatsApp webhook verified' : 'Verification failed');
});

export const connectCalendar = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { code } = req.body;
  const result = await IntegrationService.connectGoogleCalendar(tenantId, code);
  return success(res, result, 'Calendar connected');
});

export const syncWhatsApp = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const { contactPhone } = req.body;
  const result = await IntegrationService.syncWhatsAppMessages(tenantId, contactPhone);
  return success(res, result, 'WhatsApp sync completed');
});
