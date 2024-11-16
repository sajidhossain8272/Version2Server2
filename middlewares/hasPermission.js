const mongoose = require('mongoose');
const AccessControl = require('accesscontrol');

const grantsSchema = new mongoose.Schema({
    role: String,
    resource: String,
    action: String,
    attributes: [ String ]
});

const Grants = mongoose.model('Permission', grantsSchema);

module.exports = async function (req, res, next) {
    const grants = await Grants.find({ role: req.user.role }).select('-_id -__v').lean();
    if(!grants) return res.status(403).send('You are not allowed to access this resource.');

    const ac = new AccessControl(grants);

    if(req.method === 'POST'){
        const permission = ac.can(req.user.role).createAny(req.baseUrl);
        if(!permission.granted) return res.status(403).send('You are not allowed to access this resource.');
    }
    if(req.method === 'GET'){
        const permission = ac.can(req.user.role).readAny(req.baseUrl);
        if(!permission.granted) return res.status(403).send('You are not allowed to access this resource.');
    }
    if(req.method === 'PUT'){
        const permission = ac.can(req.user.role).updateAny(req.baseUrl);
        if(!permission.granted) return res.status(403).send('You are not allowed to access this resource.');
    }
    if(req.method === 'DELETE'){
        const permission = ac.can(req.user.role).deleteAny(req.baseUrl);
        if(!permission.granted) return res.status(403).send('You are not allowed to access this resource.');
    }
 
    next();
}