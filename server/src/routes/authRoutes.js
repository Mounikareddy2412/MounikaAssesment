import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

export function createAuthRouter({ store, jwtSecret }) {
  const router = Router();

  router.post('/login', async (req, res, next) => {
    try {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');

      if (!email || !password) {
        throw new HttpError(400, 'Email and password are required');
      }

      const data = await store.read();
      const user = data.users.find((candidate) => candidate.email === email);
      const validPassword = user && (await bcrypt.compare(password, user.passwordHash));

      if (!validPassword) throw new HttpError(401, 'Invalid email or password');

      const token = jwt.sign(
        { sub: user.id, email: user.email, name: user.name },
        jwtSecret,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
