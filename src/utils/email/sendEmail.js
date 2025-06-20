import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'marzk756@gmail.com',
    pass: "mzqk wrlx fmfy mjvm"
  }
});

const sendEmail = async (to ,subject, content) => {
  try {
    const {html,text}= content;
    const info = await transporter.sendMail({
      from: `"Taswya.Org "<marzk756@gmail.com>`,
      to: to,
      subject,
      ...( html ? {html} : {text} )
    });
  } catch (error) {
    console.error(error);
  }
};
export const Subjects = {
  ForgotPassword : "forgot-password",
  ResetPassword : "reset-password",
  VerifyEmail : "verify-email",
  AccountUpdate : "account-update",
  Activated : " Account Activated successfully !",
  reActiveAccount:" reActivation-email",
  ApplicationAccepted: "Application Accepted",
  ApplicationRejected: "Application Rejected"
}

export default sendEmail;
