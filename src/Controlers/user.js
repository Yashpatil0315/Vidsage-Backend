const User = require('../models/user');
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
async function newUserlogin(req ,res) {
    const { email , password } = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.status(404).send("User not found");
    }

    //comparing the stored password withe entered password by user during login
    const isMatch = await bcrypt.compare(password,user.password);
    if (!isMatch) return res.status(400).send("incorrect password");

    //Providing token for authorization and secure access to protected routes
    const token = setUser(user);
    res.cookie("token", token);

    return res.status(200).send("login successful");
}

module.exports = {
    newUserRegistration,
    newUserlogin
};