import { EventEmitter } from "events";
import { generateOtp } from "../otp/generateOtp.js";
import sendEmail, { Subjects } from "./../email/sendEmail.js";
import { asyncHandler } from "../error handling/asyncHandler.js";
import { hash } from "../hashing/hash.js";
import { otpTypes } from "../../DB/Models/user.js";

export const send_otp = new EventEmitter();

send_otp.on("reActivateAcc",asyncHandler(async (email,subject,user) => {
    const otp = generateOtp()
    const text =`your reActivation otp is: ${otp}`
    user.OTP.push({ code: hash({plainText:otp}), type: otpTypes.reActivateEmail});
    await user.save();
    await sendEmail(email,subject,{text})

}));
send_otp.on("confirmEmail",asyncHandler(async (email,subject,user) => {
    const otp = generateOtp()
    const text =`your confirm Email otp is: ${otp}`
    user.OTP.push({ code: hash({plainText:otp}), type: otpTypes.confirmEmail});
    await user.save();
    await sendEmail(email,subject,{text})

}));

send_otp.on("resetPass",asyncHandler(async (email,subject,user) => {
//   console.log(email);
  
    const otp = generateOtp()
    const text =`your reset Password otp is: ${otp}`
    user.OTP.push({ code:hash({plainText:otp}), type: otpTypes.forgetPassword });
    await user.save();

    await sendEmail(email,subject,{text})

}));

