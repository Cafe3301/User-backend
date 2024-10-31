const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();

// Rota para redefinir a senha
router.post('/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmpassword } = req.body;

    if (!newPassword || newPassword !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.password = passwordHash;
        user.resetPasswordToken = null; // Limpa o token
        user.resetPasswordExpires = null; // Limpa a expiração
        await user.save();

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).json({ message: 'Erro ao redefinir a senha.' });
    }
});

module.exports = router;
