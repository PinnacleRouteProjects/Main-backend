const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();


const sendMail = async ({ name, email, message, phone }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // IMPORTANT
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // use correct env name
    },
  });

  const mailOptions = {
    from: `"Website Contact" <${process.env.EMAIL_USER}>`,
    to: process.env.TO_EMAIL,
    replyTo: email,
    subject: `New Contact Form By ${name}`,
    html: `
      <h3>Name: ${name}</h3>
      <p>Email: ${email}</p>
      <p>Phone No.: ${phone || "N/A"}</p>
      <p>Message:</p>
      <p>${message}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const handleContactForm = async (req, res) => {
    const { name, email, message, phone, token } = req.body;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET;

      if (!name || !email || !message || !token) {
        return res.status(400).json({ error: 'All fields including reCAPTCHA are required' });
      }

      if (!recaptchaSecret) {
        console.error('RECAPTCHA_SECRET is not configured');
        return res.status(500).json({ error: 'Server reCAPTCHA not configured' });
      }

    try {
        console.log('reCAPTCHA token received');
        
        const response = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${token}`
        );

        console.log('reCAPTCHA response:', response.data);

        if (!response.data.success) {
          return res.status(400).json({
            error: 'reCAPTCHA verification failed',
            errorCodes: response.data['error-codes'] || []
          });
        }

        const mailResult = await sendMail({ name, email, message, phone });
        console.log('Email send result:', mailResult);

        res.status(200).json({ success: true, message: 'Email Sent!' });
    } catch (error) {
        console.error('Error in contact API:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
    };

    module.exports = { handleContactForm };