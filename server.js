const express = require('express');
const db = require('./db');
const currencyRoutes = require('./routes/currencyRoute');
const dotenv = require('dotenv');
dotenv.config();

const app = express();


const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(currencyRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 