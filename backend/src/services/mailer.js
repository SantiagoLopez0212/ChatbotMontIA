const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendRecoveryEmail(email, code) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de Contraseña - MontIA',
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Código de Recuperación</h2>
                    <p>Hola,</p>
                    <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para continuar:</p>
                    <h1 style="color: #00ea90; letter-spacing: 5px;">${code}</h1>
                    <p>Este código expirará en 15 minutos.</p>
                    <p>Si no solicitaste esto, ignora este correo.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error enviando correo:', error);
        throw new Error('No se pudo enviar el correo de recuperación.');
    }
}

module.exports = { sendRecoveryEmail };
