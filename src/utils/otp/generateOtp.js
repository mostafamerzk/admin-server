import  otpGenerator from'otp-generator';

export const generateOtp = ()=>{
    const otp = otpGenerator.generate(6,{
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false
    })
    return otp;
};

