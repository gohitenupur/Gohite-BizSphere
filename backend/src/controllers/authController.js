import * as authService from '../services/authService.js';

export async function login(req, res) {
  const { email, password, businessId } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const result = await authService.login(email, password, businessId);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result);
}

export async function listBusinesses(req, res) {
  const userId = req.user?.id;
  const role = req.user?.role;
  const businesses = await authService.listBusinessesForUser(userId, role);
  return res.json({ data: businesses });
}
