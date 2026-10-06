import { Router } from 'express';
import {
  getResults,
  createResult,
  bulkUploadResults,
} from '../controllers/result.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createResultValidator,
  bulkUploadResultsValidator,
  getResultsQueryValidator,
} from '../validators/result.validator.js';
import { verifyAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyAuth);

router.get('/', validate(getResultsQueryValidator), getResults);
router.post('/', validate(createResultValidator), createResult);
router.post('/bulk', validate(bulkUploadResultsValidator), bulkUploadResults);

export default router;
