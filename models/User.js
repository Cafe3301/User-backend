// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: String,
    phone: String,
    cpf: String,
    confirmationToken: String, // Campo para o token de confirmação
    confirmationExpires: Date,  // Campo para a data de expiração
    isConfirmed: {
        type: Boolean,
        default: false, // Para controlar se o email foi confirmado
    },
});

module.exports = mongoose.model('User', userSchema);
