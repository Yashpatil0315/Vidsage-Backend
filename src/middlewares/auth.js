const {getUser} = require('../service/auth');


//middleware function to restrict the user from using the services without logging in.
function authMiddleware(req, res, next) {

    const token = req.cookies.token;
    const user = getUser(token);
    if(!user) return res.status(401).send("Access Denied. User NOt logged in");

    return next();
}

module.exports = {authMiddleware};