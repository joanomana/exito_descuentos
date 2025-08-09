const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  marca: String,

  descuento: String,
  precioOriginal: String,
  precioConDescuento: String,


  descuentoNum: Number,
  precioOriginalNum: Number,
  precioConDescuentoNum: Number,

  precioAliado: String,
  categoria: { type: String, index: true },

  enlace: { type: String, required: true, unique: true, index: true },

  lastSeenAt: { type: Date, index: true },


  timestamp: { type: Date, default: Date.now },
  creadoEn: { type: Date, default: Date.now }
}, { timestamps: false });



module.exports = mongoose.model('Producto', productoSchema);
