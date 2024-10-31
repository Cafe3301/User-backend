const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();

// Rota para redefinir a senha
router.post('/:token', async (req, res) => {
    const { token } = req.params;
    console.log('Token recebido:', token); // Log do token recebido
    const { newPassword, confirmpassword } = req.body;

    if (!newPassword || newPassword !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // Verifica se o token não expirou
        });
        console.log('Usuário encontrado:', user); // Log do usuário encontrado

        if (!user) {
            return res.status(404).json({ msg: 'Token inválido ou expirado.' });
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        user.password = passwordHash;
        user.resetPasswordToken = undefined; // Limpa o token
        user.resetPasswordExpires = undefined; // Limpa a expiração
        await user.save();

        res.status(200).json({ msg: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).json({ msg: 'Erro ao redefinir a senha.' });
    }
});

module.exports = router;
