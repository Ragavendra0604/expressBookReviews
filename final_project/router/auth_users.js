const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
    if(!username || typeof username !== "string") {
        return false;
    }
    const exists = users.some(u => u.username === username);
    return !exists;
};

const authenticatedUser = (username, password) => {
    const user = users.find(u => u.username === username);
    if(!user){
        return false;
    }
    return user.password === password;
};

//only registered users can login
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body || {};
  
    if(!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }
  
    if(!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
  
    // Sign JWT and store in session so protected routes can use it
    const accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });
    req.session.authorization = { accessToken, username };
  
    return res.status(200).json({
        message: "Logged in successfully",
        token: accessToken,
        username
    });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    // Confirm session set by /login
    const auth = req.session?.authorization;
    if(!auth?.username) {
        return res.status(401).json({ message: "Login required" });
    }
  
    const username = auth.username;
    const { isbn } = req.params;
      
    const book = books[isbn];
    if(!book) {
        return res.status(404).json({ message: "Book not found" });
    }
  
    // Accept review from body or query for compatibility with some skeletons
    const review = (req.body && req.body.review) ?? req.query.review;
    if(!review) {
        return res.status(400).json({ message: "Missing 'review' content" });
    }
  
    if(!book.reviews) book.reviews = {};
    book.reviews[username] = review;
  
    return res.status(200).json({
        message: "Review added/updated",
        isbn,
        by: username,
        reviews: book.reviews
    });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const auth = req.session?.authorization;
    if(!auth?.username) {
        return res.status(401).json({ message: "Login required" });
    }
    const username = auth.username;
    const { isbn } = req.params;
  
    const book = books[isbn];
    if(!book) return res.status(404).json({ message: "Book not found" });
  
    if(!book.reviews || !book.reviews[username]) {
        return res.status(404).json({ message: "No existing review by this user" });
    }
  
    delete book.reviews[username];
    return res.status(200).json({ message: "Review deleted", isbn });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
