const jwt = require('jsonwebtoken');
const config = require('config');
const { User } = require('../models/user');

module.exports = async function(req, res, next) {
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decodedPayload = jwt.verify(token, config.get('jwtPrivateKey'));

        const user = await User.findById(decodedPayload._id).select('accessToken');
        if(token !== user.accessToken) return res.status(403).send('Another device logged in.');

        req.user = decodedPayload;
        next();
    }
    catch(ex) {
        res.status(401).send('Invalid token.');
    }
}