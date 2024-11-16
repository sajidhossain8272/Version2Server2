const bcrypt = require('bcrypt');
const express = require('express');
const fs = require('fs/promises');
const auth = require('../middlewares/auth');
const hasPermission = require('../middlewares/hasPermission');
const { User, validate, validateOnUpdate } = require('../models/user');
const mongoose = require('mongoose');
const router = express.Router();

// create user from admin panel
router.post('/', [ auth, hasPermission ], async (req, res) => {
    const error = await validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne()
        .or([ {email: req.body.email}, {phone: req.body.phone} ]);
    if(user) return res.status(400).send('User already registered');

    user = new User(req.body);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;

    await user.save();

    res.send('User created successfully.');
});

// view users in row from admin panel => default landing page of users
router.get('/', [ auth, hasPermission ], async (req, res) => {
    const pageNo = parseInt(req.query.pageNo);
    const row = parseInt(req.query.row);

    const result = await User
                    .find()
                    .skip(pageNo * row)
                    .limit(row)
                    .populate('goal', 'title -_id')
                    .select('-password -otp -accessToken -__v');

    const count = await User.estimatedDocumentCount();

    res.send({count: count, result: result});
});

// update an user
router.put('/:id', [ auth, hasPermission ], async (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send('Invalid user.');

    const user = await User.findById(req.params.id);
    if(!user) return res.status(400).send('Invalid user.');

    const error = await validateOnUpdate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    const anotherUser = await User.findOne()
        .or([ {email: req.body.email}, {phone: req.body.phone} ]);
    if(anotherUser) return res.status(400).send('Another user already registered with this email or phone.');

    if(req.body.password){
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        req.body.password = hashedPassword;
    }

    await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.send('User updated successfully.');
});

// delete an user
router.delete('/:id', [ auth, hasPermission ], async (req, res) => {
    if(!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(400).send('Invalid user.');

    const user = await User.findById(req.params.id);
    if(!user) return res.status(400).send('Invalid user.');

    if(user.avatar) await fs.unlink(user.avatar);

    await User.findByIdAndRemove(req.params.id);

    res.send('User deleted successfully.');
});

// search an user by name/ email/ phone
router.get('/search', [ auth, hasPermission ], async (req, res) => {
    const result = await User.find()
            .or([ { name: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } }, 
                    { email: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } }, 
                    { phone: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } } 
                ])
            .populate('goal', 'title -_id')
            .select('-password -otp -accessToken -__v');
    
    const count = await User.countDocuments()
            .or([ { name: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } }, 
                    { email: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } }, 
                    { phone: {$regex: `${req.query.nameOrEmailOrPhone}`, $options: 'i' } } 
                ]);
            
    res.send({count: count, result: result});
});

// search user by filters
router.get('/filterSearch', [ auth, hasPermission ], async (req, res) => {  
    let query = []; 

    for (let x in req.query){
        let object = { [x]: req.query[x] };
        query.push(object);
    }

    const result = await User.find()
        .and(query)
        .populate('goal', 'title -_id')
        .select('-password -otp -accessToken -__v');
    
    const count = await User.countDocuments()
                            .and(query);
            
    res.send({count: count, result: result});
});

module.exports = router;