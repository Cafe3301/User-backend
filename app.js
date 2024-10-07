require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();

// Configurar CORS
app.use(cors({
    origin: 'http://localhost:5173'
}));

// Configurar JSON - resposta
app.use(express.json());

// Models
const User = require('./models/User');

// Rota pública
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem-vindo à nossa API!' });
});

// Rota privada
app.get("/user/:id", checkToken, async (req, res) => {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ msg: "ID inválido" });
    }

    try {
        const user = await User.findById(id, '-password');
        if (!user) {
            return res.status(404).json({ msg: "Usuário não encontrado" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente" });
    }
});

function checkToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ msg: "Acesso negado" });
    }

    try {
        const secret = process.env.SECRET;
        jwt.verify(token, secret);
        next();
    } catch (error) {
        res.status(400).json({ msg: "Token inválido" });
    }
}

// Registrar usuário
app.post('/auth/register', async (req, res) => {
    const { name, email, password, confirmpassword } = req.body;

    if (!name) {
        return res.status(422).json({ msg: 'O nome é obrigatório' });
    }
    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório' });
    }
    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatória' });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    const userExist = await User.findOne({ email: email });
    if (userExist) {
        return res.status(422).json({ msg: 'Por favor, use outro email' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: passwordHash,
    });
    try {
        await user.save();
        res.status(201).json({ msg: "Usuário criado com sucesso" });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente" });
    }
});

// Login User
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório' });
    }
    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatória' });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    // Adicione logs para depuração
    console.log('Senha fornecida:', password);
    console.log('Senha armazenada:', user.password);

    const checkPassword = await bcrypt.compare(password, user.password);
    
    // Log do resultado da comparação
    console.log('Senha válida?', checkPassword);
    
    if (!checkPassword) {
        return res.status(404).json({ msg: 'Senha inválida' });
    }

    try {
        const secret = process.env.SECRET;
        const token = jwt.sign({ id: user._id }, secret);
        res.status(200).json({ msg: "Autenticação realizada com sucesso", token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente" });
    }
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
