const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {authMiddleware} = require('./src/middlewares/auth');

const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const userRoute = require('./src/Routes/user');

// routes for all the services of user module
app.use('/user',userRoute);

mongoose.connect('mongodb://127.0.0.1:27017/Vidsage')
  .then(() => console.log('Connected!'));


// MIddle ware working 
app.get('/home', authMiddleware, (req, res) => {
  res.cookie("name", "Yash");
  res.send("done")
});



app.get('/getcookie', (req, res) => {
  console.log(req.cookies);
  res.send(cookie);
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

