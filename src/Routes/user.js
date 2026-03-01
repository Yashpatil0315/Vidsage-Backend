const express = require('express');
const { newUserRegistration, newUserlogin, getUserProfile, logoutUser } = require('../Controlers/user');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/', (req, res) => {
    res.send("User route working");
});

router.post('/register', newUserRegistration);
router.post('/login', newUserlogin);
router.get('/me', authMiddleware, getUserProfile);
router.post('/logout', logoutUser);

module.exports = router;
