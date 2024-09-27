import nodemailer from 'nodemailer';

// Create a transporter using your email service configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'gmail' for Gmail service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your app password or email password
  },
});

// Function to send an email
const sendEmail = async (to, subject, htmlContent) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Use your email address
    to, // Recipient email
    subject, // Email subject
    html: htmlContent, // HTML content
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
    return info; 
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; 
  }
};

export { sendEmail };



// import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY);

// const sendEmail = async (to, subject, htmlContent) => {

//   console.log("this is all data to send ::" , to, subject, htmlContent)
//   try {
//     const email = await resend.emails.send({
//       from: 'yash51217@gmail.com', 
//       to: [to], 
//       subject,
//       html: htmlContent,
//     });

//     console.log('Email sent successfully:', email);
//     return email; 
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw error; 
//   }
// };

// export { sendEmail };
