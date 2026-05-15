const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();


const sendMail = async ({ name, email, phone, company, website, projectType, budgetRange, timeline, mainBusinessChallenge }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  const toEmail = process.env.TO_EMAIL;

  if (!emailUser || !emailPassword || !toEmail) {
    throw new Error('Email service is not configured (EMAIL_USER, TO_EMAIL, and GMAIL_APP_PASSWORD or EMAIL_PASS are required)');
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  const mailOptions = {
    from: `"Website Contact" <${emailUser}>`,
    to: toEmail,
    replyTo: email,
    subject: `New Strategy Session Request from ${name}`,
    html: `
      <h2>New Strategy Session Request</h2>
      <hr />
      <h3>Personal Information</h3>
      <p><strong>Full Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone/WhatsApp:</strong> ${phone || "N/A"}</p>

      <h3>Business Information</h3>
      <p><strong>Company/Business:</strong> ${company || "N/A"}</p>
      <p><strong>Website:</strong> ${website || "N/A"}</p>

      <h3>Project Details</h3>
      <p><strong>Project Type:</strong> ${projectType || "N/A"}</p>
      <p><strong>Budget Range:</strong> ${budgetRange || "N/A"}</p>
      <p><strong>Timeline:</strong> ${timeline || "N/A"}</p>

      <h3>Main Business Challenge</h3>
      <p>${mainBusinessChallenge || "N/A"}</p>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const handleContactForm = async (req, res) => {
    const { name, email, phone, company, website, projectType, budgetRange, timeline, mainBusinessChallenge, message, token } = req.body;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET;

    // Accept either `mainBusinessChallenge` or `message` from client
    if (!name || !email || !(mainBusinessChallenge || message) || !token) {
      return res.status(400).json({ error: 'Name, email, main business challenge (or message), and reCAPTCHA are required' });
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

        const finalMainBusinessChallenge = mainBusinessChallenge || message;
        const mailResult = await sendMail({ name, email, phone, company, website, projectType, budgetRange, timeline, mainBusinessChallenge: finalMainBusinessChallenge });
        console.log('Email send result:', mailResult);

        res.status(200).json({ success: true, message: 'Strategy session request sent!' });
    } catch (error) {
        console.error('Error in contact API:', error);
      res.status(500).json({ error: 'Something went wrong', details: error.message });
    }
    };

    module.exports = { handleContactForm };