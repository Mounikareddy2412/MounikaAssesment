import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

export function authMiddleware(secret) {
  return (req, _res, next) => {
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return next(new HttpError(401, 'Authentication required'));

    try {
      req.user = jwt.verify(token, secret);
      return next();
    } catch {
      return next(new HttpError(401, 'Invalid or expired token'));
    }
  };
}
