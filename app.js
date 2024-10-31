// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const forgotPasswordRouter = require('./routes/forgotPassword');
const resetPasswordRouter = require('./routes/resetPassword');

const app = express();

// Configurar CORS
app.use(cors());

// Configurar JSON
app.use(express.json());

// Usar as rotas de autenticação
app.use('/auth', authRoutes);
// Conexão ao banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.bo0dq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => {
        app.listen(3000, () => console.log('Conectou ao banco e servidor rodando na porta 3000'));
    })
    .catch((err) => console.log(err));
