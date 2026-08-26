import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAdmin } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAdmin);

// ── Schemes ──────────────────────────────────────────────────────────────────

// GET /api/admin/schemes
router.get('/schemes', async (_req: Request, res: Response) => {
  const { rows } = await pool.query('SELECT * FROM schemes ORDER BY id ASC');
  res.json(rows);
});

// PUT /api/admin/schemes/:id — update key fields
router.put('/schemes/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, description, max_income_lakh, max_loan_lakh, min_loan_lakh,
    interest_rate_min, interest_rate_max, moratorium_months_min, moratorium_months_max,
    max_tenure_months, notes, active, gender_eligibility,
    documents_required, channel_partner_types,
  } = req.body as Record<string, unknown>;

  const { rows } = await pool.query(
    `UPDATE schemes SET
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      max_income_lakh = COALESCE($4, max_income_lakh),
      max_loan_lakh = COALESCE($5, max_loan_lakh),
      min_loan_lakh = COALESCE($6, min_loan_lakh),
      interest_rate_min = COALESCE($7, interest_rate_min),
      interest_rate_max = COALESCE($8, interest_rate_max),
      moratorium_months_min = COALESCE($9, moratorium_months_min),
      moratorium_months_max = COALESCE($10, moratorium_months_max),
      max_tenure_months = COALESCE($11, max_tenure_months),
      notes = COALESCE($12, notes),
      active = COALESCE($13, active),
      gender_eligibility = COALESCE($14, gender_eligibility),
      documents_required = COALESCE($15, documents_required),
      channel_partner_types = COALESCE($16, channel_partner_types)
    WHERE id = $1
    RETURNING *`,
    [
      id, name, description, max_income_lakh, max_loan_lakh, min_loan_lakh,
      interest_rate_min, interest_rate_max, moratorium_months_min, moratorium_months_max,
      max_tenure_months, notes, active, gender_eligibility,
      documents_required, channel_partner_types,
    ]
  );

  if (rows.length === 0) { res.status(404).json({ error: 'Scheme not found' }); return; }
  res.json(rows[0]);
});

// PATCH /api/admin/schemes/:id/toggle — toggle active
router.patch('/schemes/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'UPDATE schemes SET active = NOT active WHERE id = $1 RETURNING id, name, active',
    [id]
  );
  if (rows.length === 0) { res.status(404).json({ error: 'Scheme not found' }); return; }
  res.json(rows[0]);
});

// ── Partners ─────────────────────────────────────────────────────────────────

// GET /api/admin/partners
router.get('/partners', async (_req: Request, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, name, partner_type, city, state, district, phone, email,
            eligible_categories, npa_percent, fund_utilization_percent,
            fund_availability_status, is_active
     FROM partners ORDER BY id ASC`
  );
  res.json(rows);
});

// PATCH /api/admin/partners/:id/toggle
router.patch('/partners/:id/toggle', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    'UPDATE partners SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active',
    [id]
  );
  if (rows.length === 0) { res.status(404).json({ error: 'Partner not found' }); return; }
  res.json(rows[0]);
});

// PUT /api/admin/partners/:id — update status fields
router.put('/partners/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fund_availability_status, npa_percent, fund_utilization_percent, is_active } = req.body as Record<string, unknown>;

  const { rows } = await pool.query(
    `UPDATE partners SET
      fund_availability_status = COALESCE($2, fund_availability_status),
      npa_percent = COALESCE($3, npa_percent),
      fund_utilization_percent = COALESCE($4, fund_utilization_percent),
      is_active = COALESCE($5, is_active)
    WHERE id = $1 RETURNING id, name, fund_availability_status, npa_percent, is_active`,
    [id, fund_availability_status, npa_percent, fund_utilization_percent, is_active]
  );
  if (rows.length === 0) { res.status(404).json({ error: 'Partner not found' }); return; }
  res.json(rows[0]);
});

// GET /api/admin/users
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch {
    res.status(503).json({ error: 'Users table not available' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
  const [s, p] = await Promise.all([
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE active) as active FROM schemes'),
    pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active FROM partners'),
  ]);
  res.json({
    schemes: { total: Number(s.rows[0].total), active: Number(s.rows[0].active) },
    partners: { total: Number(p.rows[0].total), active: Number(p.rows[0].active) },
  });
});

export default router;
