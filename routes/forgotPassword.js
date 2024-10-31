const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            to: email,
            subject: 'Redefinição de Senha',
            text: `Aqui está o link para redefinir sua senha: 
                   http://localhost:3000/reset-password/${token}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Email enviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        res.status(500).json({ message: 'Erro ao enviar o email.' });
    }
});

module.exports = router;
