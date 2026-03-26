const express = require('express');
const router  = express.Router();
const { getTimelineTemplates, saveTimelineTemplates } = require('../db');

function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
}
function requireAdmin(req, res, next) {
  if (req.session?.role !== 'super_admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

// GET all templates (any logged-in user — PMs need to read these)
router.get('/', requireAuth, (req, res) => {
  res.json(getTimelineTemplates());
});

// POST create template
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { name, phases } = req.body;
  if (!name || !Array.isArray(phases)) return res.status(400).json({ error: 'name and phases required' });
  const templates = getTimelineTemplates();
  const tpl = {
    id:        'tpl_' + Date.now(),
    name:      name.trim(),
    phases,
    createdAt: new Date().toISOString(),
    createdBy: req.session.username || req.session.userId,
  };
  templates.push(tpl);
  saveTimelineTemplates(templates);
  res.json(tpl);
});

// PUT update template name (or phases)
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const templates = getTimelineTemplates();
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, phases } = req.body;
  if (name)   templates[idx].name   = name.trim();
  if (phases) templates[idx].phases = phases;
  saveTimelineTemplates(templates);
  res.json(templates[idx]);
});

// DELETE template
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  let templates = getTimelineTemplates();
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  templates.splice(idx, 1);
  saveTimelineTemplates(templates);
  res.json({ ok: true });
});

module.exports = router;
