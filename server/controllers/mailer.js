import nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import ENV from '../config.js';

// Function to send email from a Gmail account
const sendEmailFromGmail = async (userEmail, subject, emailBody) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: ENV.EMAIL, // Your Gmail email
            pass: ENV.PASSWORD, // Your Gmail password
        },
    });

    let message = {
        from: ENV.EMAIL, // Sender email
        to: userEmail, // Receiver email
        subject: subject || 'Signup Successful',
        html: emailBody,
    };

    return transporter.sendMail(message);
};


// Function to send email from a testing (Ethereal) account
const sendEmailFromTestingAccount = async (userEmail, subject, emailBody) => {
    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: ENV.TEST_EMAIL,
            pass: ENV.TEST_PASSWORD,
        },
    });

    let message = {
        from: '"Your Name" <foo@example.com>', // Sender information
        to: userEmail, // Receiver email
        subject: subject || 'Signup Successful',
        html: emailBody,
    };

    return transporter.sendMail(message);
};

const MailGenerator = new Mailgen({
    theme: 'default',
    product: {
        name: 'Foxx Life Sciences',
        link: 'https://foxxlifesciences.com/',
        logo: 'https://www.foxxlifesciences.com/cdn/shop/t/37/assets/logo.png?v=149756107581828300611700623519', // Directly provide the logo URL here
    },
});


export const registerMail = async (req, res) => {
    const { username, userEmail, text, subject } = req.body;

    const emailContent = {
        body: {
            name: username,
            intro: text || 'Welcome! We\'re excited to have you on board.',
            outro: 'Need help or have questions? Email us at support@foxxlifesciences.com',
        },
    };

     // Custom HTML footer content
     const customFooter = `
     <div style="text-align: center; font-size: 12px;">
         <p>
             <a href="https://foxxlifesciences.com/terms">Terms</a> |
             <a href="https://foxxlifesciences.com/privacy">Privacy</a> |
             <a href="https://foxxlifesciences.com/contact">Contact</a>
         </p>
     </div>
 `;


    const emailBody = MailGenerator.generate(emailContent);

    try {

         // Append custom HTML footer to the email body
         const finalEmailBody = `${emailBody}\n\n${customFooter}`;

        // Send email from Gmail account
        await sendEmailFromGmail(userEmail, subject, finalEmailBody);

        // Send email from testing account (Ethereal)
        await sendEmailFromTestingAccount(userEmail, subject, finalEmailBody);

        return res.status(200).send({ msg: 'Emails sent successfully.' });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
};
