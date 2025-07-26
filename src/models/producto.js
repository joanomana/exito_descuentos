const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  marca: String,
  descuento: String,
  precioOriginal: String,
  precioConDescuento: String,
  precioAliado: String,
  enlace: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
  
});
productoSchema.index({ titulo: 1, precioConDescuento: 1 }, { unique: true });

module.exports = mongoose.model('Producto', productoSchema);
