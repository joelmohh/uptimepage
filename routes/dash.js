const router = require('express').Router();
const jwt = require('jsonwebtoken');


router.get('/login', (req, res) => {
    res.render('login');
});
router.get('/main', (req, res) => {
    res.render('dashboard');
});

module.exports = router;