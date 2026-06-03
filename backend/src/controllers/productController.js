import * as productService from '../services/productService.js';

export async function list(req, res) {
  const result = await productService.listProducts(req.business, req.query);
  return res.json(result);
}

export async function create(req, res) {
  const result = await productService.createProduct(req.business, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error, details: result.details });
  return res.status(201).json(result);
}

export async function update(req, res) {
  const result = await productService.updateProduct(req.business, req.user.id, req.params.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error, details: result.details });
  return res.json(result);
}

export async function remove(req, res) {
  const result = await productService.softDeleteProduct(req.business, req.user.id, req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result);
}

export async function adjustStock(req, res) {
  const result = await productService.adjustStock(req.business, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result);
}

export async function expiring(req, res) {
  const days = req.query.days ? parseInt(req.query.days, 10) : undefined;
  const result = await productService.getExpiringProducts(req.business, days);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result);
}
