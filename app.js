// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const User = require('./models/User');

const app = express();

// Configurar CORS usando a variável de ambiente
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

// Configurar CORS
app.use(cors({
    origin: (origin, callback) => {
        // Verifica se o domínio de origem está na lista de permitidos
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin);
        } else {
            callback(new Error('Não autorizado por CORS'));
        }
    }
}));

// Configurar JSON - resposta
app.use(express.json());

// Rota pública
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem-vindo à nossa API!' });
});

// Registrar usuário
app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmpassword, phone, cpf } = req.body;

    if (!name || !email || !password || !phone || !cpf) {
        return res.status(422).json({ msg: 'Todos os campos são obrigatórios' });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
        return res.status(422).json({ msg: 'Por favor, use outro email' });
    }

    const cpfExist = await User.findOne({ cpf });
    if (cpfExist) {
        return res.status(422).json({ msg: 'Por favor, use outro CPF' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: passwordHash,
        phone,
        cpf,
    });

    try {
        await user.save();
        res.status(201).json({ 
            msg: "Usuário criado com sucesso",
            user: {
                name: user.name,
                email: user.email,
                cpf: user.cpf,
            },
            token: "seu_token_aqui" // Substitua por um token real, se necessário
        });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente" });
    }
});

// Rota de login
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ msg: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
        return res.status(422).json({ msg: 'Senha inválida' });
    }

    res.status(200).json({ msg: 'Login bem-sucedido', user });
});


// Conexão ao banco de dados
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.bo0dq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => {
        app.listen(3000);
        console.log('Conectou ao banco');
    })
    .catch((err) => console.log(err));
