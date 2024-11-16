const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {

    res.send('Panorama Server is running :) ... CI / CD is integrated... Testing ... ');

});

module.exports = router;
