const mongoose = require('mongoose');
require('dotenv').config();

const conectarDB = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error('❌ URI de MongoDB no definida en .env');
        await mongoose.connect(process.env.MONGODB_URI);
    } catch (err) {
        console.error('❌ Error conectando a MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = conectarDB;
