import { logger } from '../config/logger.js';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, { stack: err.stack });

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'BAD_REQUEST', 'Malformed JSON in request body', 400);
  }

  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        const fields = err.meta?.target ? (Array.isArray(err.meta.target) ? err.meta.target.join(', ') : err.meta.target) : 'field';
        return errorResponse(
          res,
          'CONFLICT',
          `A record with this ${fields} already exists.`,
          409
        );
      }
      case 'P2025':
        return errorResponse(res, 'NOT_FOUND', 'Requested record was not found.', 404);
      case 'P2003':
        return errorResponse(res, 'FOREIGN_KEY_VIOLATION', 'Related record does not exist.', 400);
      default:
        break;
    }
  }

  if (err.statusCode) {
    return errorResponse(res, err.code || 'APP_ERROR', err.message, err.statusCode, err.details);
  }

  const message = process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : err.message;
  return errorResponse(res, 'INTERNAL_SERVER_ERROR', message, 500);
};

export const notFoundHandler = (req, res) => {
  return errorResponse(
    res,
    'ROUTE_NOT_FOUND',
    `Cannot ${req.method} ${req.originalUrl}`,
    404
  );
};
