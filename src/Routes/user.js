const express = require('express');
const { newUserRegistration } = require('../Controlers/user');
const { newUserlogin } = require('../Controlers/user');

const router = express.Router();

router.get('/', (req, res) => {
    res.send("User route working");
});

router.post('/register', newUserRegistration);
router.post('/login', newUserlogin);

module.exports = router;
