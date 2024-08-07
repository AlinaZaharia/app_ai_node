const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    service: "gmail",
    // host: "smtp.gmail.com",
    // port: 465,
    // secure: true,
    auth: {
      user: "chat.ai.romania00@gmail.com",
      pass: "bpoybpjmihxvoxxd",
    },
  });



  


  function sendEmail (email, subject, html) {
    const mailOptions = {
      from: "chat.ai.romania00@gmail.com",
      to: email,
      subject: subject,
      html: html,
      
    };
  
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
  }


  module.exports = {sendEmail}