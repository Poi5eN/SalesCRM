import { Router } from 'express';
import { CompanyController } from './company.controller.ts';
import validate from '@/middleware/validate.ts';
import authGuard from '@/middleware/authGuard.ts';
import asyncHandler from '@/utils/asyncHandler.ts';
import { 
  createCompanySchema, 
  updateCompanySchema, 
  companyFilterSchema 
} from './company.schemas.ts';

const router = Router();

router.use(authGuard);

router.get('/', validate(companyFilterSchema), asyncHandler(CompanyController.list));
router.post('/', validate(createCompanySchema), asyncHandler(CompanyController.create));

router.get('/:id', asyncHandler(CompanyController.get));
router.patch('/:id', validate(updateCompanySchema), asyncHandler(CompanyController.update));
router.delete('/:id', asyncHandler(CompanyController.delete));

router.get('/:id/contacts', asyncHandler(CompanyController.getContacts));
router.get('/:id/deals', asyncHandler(CompanyController.getDeals));

export default router;
