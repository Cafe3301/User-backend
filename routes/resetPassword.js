const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

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
            return res.status(404).json({ msg: 'Token inválido ou expirado' });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ msg: 'Senha redefinida com sucesso' });
    } catch (error) {
        res.status(500).json({ msg: 'Erro ao redefinir a senha.' });
    }
});

module.exports = router;
