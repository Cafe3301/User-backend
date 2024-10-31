const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        // Configurar o transportador do Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true para 465, false para outras portas
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Usar a URL base da variável de ambiente
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Define a URL padrão para desenvolvimento

        const mailOptions = {
            to: email,
            subject: 'Redefinição de Senha',
            text: `Aqui está o link para redefinir sua senha: 
                   ${baseUrl}/api/auth/reset-password/${token}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email enviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({ message: 'Erro ao enviar o email.' });
    }
});

module.exports = router;
