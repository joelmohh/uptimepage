const router = require('express').Router();
const jwt = require('jsonwebtoken');


router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    if (username === process.env.AUTH_USER && password === process.env.AUTH_PASS) {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token });
    } else {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
});

module.exports = router;