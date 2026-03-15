import express from 'express';

import validateRequest from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { JobController } from './jobs.controller';
import { JobValidation } from './jobs.validation';

const router = express.Router();

/**
 * Get all jobs with filters and search
 * Accessible by: ADMIN, FREELANCER, CLIENT
 */
router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT),
  JobController.getAllJobs
);

/**
 * Get a single job detail
 * Accessible by: ADMIN, FREELANCER, CLIENT
 */
router.get(
  '/:id',
  auth(UserRole.ADMIN, UserRole.FREELANCER, UserRole.CLIENT),
  JobController.getJobById
);

/**
 * Create a new job
 * Accessible by: CLIENT only
 */
router.post(
  '/create-job',
  auth(UserRole.CLIENT),
  validateRequest(JobValidation.createJobZodSchema),
  JobController.createJob
);

/**
 * Update an existing job
 * Accessible by: CLIENT, ADMIN
 */
router.patch(
  '/:id',
  auth(UserRole.CLIENT, UserRole.ADMIN),
  validateRequest(JobValidation.updateJobZodSchema),
  JobController.updateJob
);

/**
 * Delete a job
 * Accessible by: CLIENT, ADMIN
 */
router.delete(
  '/:id',
  auth(UserRole.CLIENT, UserRole.ADMIN),
  JobController.deleteJob
);

export const JobRoutes = router;