const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
  //Write the authenication mechanism here
  const sessionToken = req.session?.authorization?.accessToken;
  const header = req.headers?.authorization || "";
  const tokenFromHeader = header.startsWith("Bearer ") ? header.slice(7) : null;

  const token = sessionToken || tokenFromHeader;
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, "access");
    req.user = { username: payload.username };
    return next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
});
 
const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
