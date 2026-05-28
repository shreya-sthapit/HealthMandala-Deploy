const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { authMiddleware } = require('../middleware/auth');

// ── POST cross-check prescribed medicines against inventory ──────────────
// Body: { medicines: [{ name, quantity }] }
// Returns each medicine enriched with unit_price, stock_quantity, inStock
router.post('/cross-check', authMiddleware, async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, error: 'medicines array is required' });
    }

    const results = await Promise.all(medicines.map(async (m) => {
      const qty = Number(m.quantity) || 1;
      // Fuzzy match: try exact first, then partial
      let inv = await Medicine.findOne({ medicine_name: new RegExp(`^${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (!inv) {
        // Partial match — take the closest result
        inv = await Medicine.findOne({ medicine_name: new RegExp(m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }
      if (!inv) {
        return { name: m.name, quantity: qty, found: false, unit_price: 0, stock_quantity: 0, inStock: false, lineTotal: 0 };
      }
      return {
        name: m.name,
        inventoryName: inv.medicine_name,
        inventoryId: inv._id,
        quantity: qty,
        found: true,
        unit_price: inv.unit_price,
        stock_quantity: inv.stock_quantity,
        inStock: inv.stock_quantity >= qty,
        lineTotal: +(inv.unit_price * qty).toFixed(2),
      };
    }));

    const grandTotal = +results.reduce((sum, r) => sum + r.lineTotal, 0).toFixed(2);
    res.json({ success: true, results, grandTotal });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET all medicines (with optional search) ──────────────────────────────
// GET /api/inventory?search=para
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search
      ? { medicine_name: { $regex: search, $options: 'i' } }
      : {};
    const medicines = await Medicine.find(filter).sort({ medicine_name: 1 });
    res.json({ success: true, medicines });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET single medicine by ID ─────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, medicine });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST create a new medicine ────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { medicine_name, unit_price, stock_quantity } = req.body;
    if (!medicine_name || unit_price == null) {
      return res.status(400).json({ success: false, error: 'medicine_name and unit_price are required' });
    }
    const medicine = await Medicine.create({ medicine_name, unit_price, stock_quantity: stock_quantity ?? 0 });
    res.status(201).json({ success: true, medicine });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'A medicine with that name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT update a medicine (price, stock, or name) ─────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { medicine_name, unit_price, stock_quantity } = req.body;
    const update = {};
    if (medicine_name  != null) update.medicine_name  = medicine_name;
    if (unit_price     != null) update.unit_price     = unit_price;
    if (stock_quantity != null) update.stock_quantity = stock_quantity;

    const medicine = await Medicine.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, medicine });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, error: 'A medicine with that name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH restock — add units to existing stock ───────────────────────────
// Body: { quantity: 100 }
router.patch('/:id/restock', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ success: false, error: 'quantity must be a positive number' });
    }
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { $inc: { stock_quantity: quantity } },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, medicine });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE a medicine ─────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
