import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'yash51217@gmail.com',
    pass: 'jisj nvwy rpon wdzf',  // Ensure you're using environment variables for sensitive data in production.
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, htmlContent, qrCodeBuffer = null) => {
  // Set up base mail options
  const mailOptions = {
    from: 'yash51217@gmail.com', 
    to, 
    subject, 
    html: htmlContent,
  };

  // If qrCodeBuffer is provided, add it to the attachments
  if (qrCodeBuffer) {
    mailOptions.attachments = [
      {
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        cid: 'qrcode'  // Content-ID for referencing the QR code in the HTML body
      }
    ];
  }

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
//       from: 'yash.bhoir@somaiya.edu', 
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
