// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const resetPasswordRouter = require('./routes/resetPassword');

const app = express();

// Configuração CORS e JSON
app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/auth/reset-password', resetPasswordRouter);

// Conexão ao banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.bo0dq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => {
        app.listen(3000, () => console.log('Servidor rodando na porta 3000 e conectado ao banco de dados.'));
    })
    .catch((err) => console.log('Erro de conexão:', err));
