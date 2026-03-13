const User = require('../Models/User');
const bcrypt = require('bcrypt');
const { setUser,getUser } = require('../service/auth');


//contriller for user signup 
async function newUserRegistration(req ,res) {
    const { name , email , password } = req.body;

    //incripting the password before storing it in database using bcrypt
    const hashPassword = await bcrypt.hash(password,10);

    await User.create({
        name,
        email,
        password:hashPassword 
    });
    return res.send("User registered successfully");
}



//contriller for user login 
async function newUserlogin(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).send("User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send("Incorrect password");
  }

  const token = setUser(user);

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false // set true in production (HTTPS)
  });

  return res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      email: user.email,
      name: user.name
    },
    token: token
  });
  
}

// controller for fetching logged-in user's profile
async function getUserProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
}

// controller for logging out — clears the auth cookie
function logoutUser(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });
  return res.status(200).json({ message: "Logged out successfully" });
}

module.exports = {
    newUserRegistration,
    newUserlogin,
    getUserProfile,
    logoutUser
};
