const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User'); // Certifique-se de que o caminho para o modelo está correto

const router = express.Router();

// Configuração do transportador do Nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER, // Seu e-mail
        pass: process.env.EMAIL_PASS,  // Sua senha do e-mail
    },
});

// Rota pública
router.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem-vindo à nossa API!' });
});

// Registrar usuário
router.post('/register', async (req, res) => {
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

    const user = new User({ name, email, password: passwordHash, phone, cpf });

    try {
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirmação de Registro',
            text: `Olá ${name},\n\nSua conta foi criada com sucesso!\n\nObrigado,\nSua equipe.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar email:', error);
                return res.status(500).json({ msg: 'Usuário criado, mas falha ao enviar email de confirmação' });
            }
            console.log('Email enviado:', info.response);
        });

        res.status(201).json({
            msg: "Usuário criado com sucesso",
            user: { name: user.name, email: user.email, cpf: user.cpf },
            token: "seu_token_aqui" // Aqui você pode gerar um token JWT, se necessário
        });
    } catch (error) {
        res.status(500).json({ msg: "Aconteceu um erro no servidor, tente novamente" });
    }
});

// Rota para solicitar redefinição de senha
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    // Salvar o token e a data de expiração no usuário
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora de expiração
    await user.save();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Redefinição de Senha',
        text: `Clique no link para redefinir sua senha: ${process.env.BASE_URL}/reset-password/${token}`,
    };
    

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar email:', error);
            return res.status(500).json({ msg: 'Erro ao enviar email de redefinição de senha' });
        }
        console.log('Email enviado:', info.response);
        res.status(200).json({ msg: 'Email de redefinição de senha enviado' });
    });
});

// Rota para redefinir a senha
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmpassword } = req.body;

    if (!newPassword || newPassword !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    // Verifique o token e a data de expiração
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() } // Verifica se não está expirado
    });

    if (!user) {
        return res.status(404).json({ msg: 'Token inválido ou expirado' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.password = passwordHash;
    user.resetPasswordToken = undefined; // Limpa o token
    user.resetPasswordExpires = undefined; // Limpa a expiração
    await user.save();

    res.status(200).json({ msg: 'Senha redefinida com sucesso' });
});

// Rota de login
router.post('/login', async (req, res) => {
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

module.exports = router;
