const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  medicine_name:  { type: String, required: true, unique: true },
  unit_price:     { type: Number, required: true },          // Price in NPR per single unit
  stock_quantity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);
