const bcrypt = require('bcrypt');
const config = require('config');
const Joi = require('joi');
const express = require('express');
const { User } = require('../models/user');
const router = express.Router();

//  first try login and if user not verified first time by OTP then send OTP
// router.post('/', async (req, res) => {
//     const error = await validateLoginInfo(req.body);
//     if(error) return res.status(400).send(error.details[0].message);

//     const user = await User.findOne()
//                     .or([ {email: req.body.phoneOrEmail}, {phone: req.body.phoneOrEmail} ]);
//     if(!user) return res.status(400).send('Invalid email/phone or password.');

//     const isValidPassword = await bcrypt.compare(req.body.password, user.password);
//     if(!isValidPassword) return res.status(400).send('Invalid email/phone or password.');

//     if(user.otp.code && user.otp.isWebVerified) {
//         const token = user.generateAuthToken();

//         user.accessToken = token;
//         await user.save();

//         return res.header('x-auth-token', token).send('Login Successful.');
//     }

//     const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
//     const salt = await bcrypt.genSalt(5);
//     const hashedOtpCode = await bcrypt.hash(otpCode, salt);
//     user.otp.code = hashedOtpCode;
//     user.otp.createdAt = Date.now();
//     await user.save();

//     const sId = config.get('sIdNonMaskingOtp');
//     const msisdn = user.phone;
//     const messageBody = `OTP (One Time Password) is ${otpCode} for verification\n\nROOTs Edu`;
//     const cmsId = `${user.phone.substr(8, 5)}-${Date.now().toString().substr(9, 4)}`;

//     const data = await sendSingleSms(sId, msisdn, messageBody, cmsId);
//     if(data.status === 'SUCCESS') return res.status(202).send('OTP sent successfully.');

//     res.status(500).send(`Couldn't send OTP.`);
// });

// // verify OTP and login
// router.post('/verify-otp', async (req, res) => {
//     const error = await validateOtp(req.body);
//     if(error) return res.status(400).send(error.details[0].message);

//     const user = await User.findOne( { phone: req.body.phone } );
//     if(!user) return res.status(400).send('Invalid request.');

//     const isValidOtp = await bcrypt.compare(req.body.otpCode, user.otp.code);
//     const isExpired = (Date.now() - user.otp.createdAt) > 2 * 60 * 1000;
//     if(!isValidOtp || isExpired) return res.status(400).send('Invalid OTP');

//     user.otp.isWebVerified = true;

//     const token = user.generateAuthToken();

//     user.accessToken = token;
//     await user.save();
    
//     res.header('x-auth-token', token).send('Login Successful.');
// });

// register
router.post('/register', async (req, res) => {
    const error = await validateUser(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne()
        .or([ {email: req.body.email}, {phone: req.body.phone} ]);
    if(user) return res.status(400).send('User already registered');

    user = new User(req.body);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;

    await user.save();

    res.send('User successfully registered.');
});

async function validateUser(req) {
    const schema = Joi.object({
        first_name: Joi.string().min(2).max(255).required(),
        last_name: Joi.string().min(2).max(255).required(),
        email: Joi.string().min(5).max(255).email().required(),
        phone: Joi.string().required(),
        password: Joi.string().min(8).max(255).required(),
        dateOfBirth: Joi.date(),
        confirmPassword: Joi.ref('password'),
    });

    try {
        await schema.validateAsync(req);
    }
    catch(err) {
        return err;
    }
}

async function validateLoginInfo(req) {
    const schema = Joi.object({
        phoneOrEmail: Joi.alternatives().try(
                            Joi.string()
                            .length(13)
                            .pattern(/^(?:8801)\d{9}$/)
                            .required(),
                            Joi.string()
                                .min(5)
                                .max(255)
                                .email()
                                .required()),
        password: Joi.string()
                    .min(8)
                    .max(255)
                    .required()
    });

    try {
        await schema.validateAsync(req);
    }
    catch(err) {
        return err;
    }
}

async function validateOtp(otpCode) {
    const schema = Joi.object({
        otpCode: Joi.string()
            .length(4)
            .required(),
        phone: Joi.string()
            .length(13)
            .pattern(/^(?:8801)\d{9}$/)
            .required(),
    });

    try {
        await schema.validateAsync(otpCode);
    }
    catch(err) {
        return err;
    }
}

module.exports = router;