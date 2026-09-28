import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (err) {
    const errorMessages = err.errors ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`) : [err.message];
    next(new ApiError(400, 'Validation failed', errorMessages));
  }
};
