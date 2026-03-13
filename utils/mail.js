import nodemailer from 'nodemailer';

let transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    post:587,
    secure:false,
    service:'gmail',
    auth:{
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD
    },
    requireTLS:true,
    tls:{
        rejectUnauthorized:false
    },
    connectionTimeout:30000,
    socketTimeout:30000

});

let verificationCodes = new Map();

export {transporter,verificationCodes};
////////////////////////////////////////////////////////////////////////////////////


