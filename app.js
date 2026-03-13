const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {Server} = require('socket.io');
const {authMiddleware} = require('./src/middlewares/auth');
const socketService = require('./src/service/socketService');
require("dotenv").config();
const port = process.env.PORT || 3001;
const cors = require("cors");

// Allow both localhost and the local network IP
const allowedOrigins = [
  "http://localhost:3000",
  "http://10.217.228.61:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));



const server = require('http').createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const userRoute = require('./src/Routes/user');
const audioProcessingRoute = require('./src/Routes/audioProcessing');
const jobInfoRoute = require('./src/Routes/jobInfo');
const aiRoutes = require("./src/Routes/ai");
app.use("/ai",authMiddleware, aiRoutes);


// routes for job information
app.use('/job',authMiddleware, jobInfoRoute);

// routes for all the services of user module
app.use('/user',userRoute);


app.use('/processAudio',authMiddleware, audioProcessingRoute);

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Vidsage';
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('MongoDB connection error:', err));


socketService(io);
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

