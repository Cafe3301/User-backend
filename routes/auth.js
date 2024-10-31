const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

// Registro de Usuário
router.post('/register', async (req, res) => {
    const { name, email, password, confirmpassword, phone, cpf } = req.body;

    if (!name || !email || !password || !phone || !cpf) {
        return res.status(422).json({ msg: 'Todos os campos são obrigatórios' });
    }
    if (password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    const userExist = await User.findOne({ email });
    const cpfExist = await User.findOne({ cpf });
    if (userExist || cpfExist) {
        return res.status(422).json({ msg: 'Email ou CPF já em uso' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = new User({ name, email, password: passwordHash, phone, cpf });

    try {
        await user.save();
        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmação de Registro',
            text: `Olá ${name},\n\nSua conta foi criada com sucesso!\n\nObrigado,\nSua equipe.`
        });
        res.status(201).json({ msg: "Usuário criado com sucesso" });
    } catch (error) {
        res.status(500).json({ msg: "Erro ao registrar usuário" });
    }
});

// Solicitação de Redefinição de Senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();

    transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Redefinição de Senha',
        text: `Clique no link para redefinir sua senha: ${process.env.FRONTEND_URL}/reset-password/${token}`,
    });

    res.status(200).json({ msg: 'Email de redefinição de senha enviado' });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(404).json({ msg: 'Credenciais inválidas' });
    }

    res.status(200).json({ msg: 'Login bem-sucedido', user });
});

module.exports = router;
