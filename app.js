const express = require('express');
const path = require('node:path');
const app = express();

const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
