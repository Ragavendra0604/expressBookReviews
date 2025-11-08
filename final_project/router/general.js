const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

// Task 6: Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).send(JSON.stringify(
      { message: "Username and password are required" }, null, 2
    ));
  }
  if (!isValid(username)) {
    return res.status(409).send(JSON.stringify(
      { message: "User already exists" }, null, 2
    ));
  }
  users.push({ username, password });
  return res.status(201).send(JSON.stringify(
    { message: "User successfully registered. You can now login!" }, null, 2
  ));
});

// Task 1: Get all books (explicit endpoint)
public_users.get('/books', (_req, res) => {
  return res.status(200).send(JSON.stringify(books, null, 2));
});

// Task 2: Get book by ISBN (IDs are 1..10 as strings)
public_users.get('/isbn/:isbn', (req, res) => {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) {
    return res.status(404).send(JSON.stringify({ message: "Book not found" }, null, 2));
  }
  return res.status(200).send(JSON.stringify(book, null, 2));
});

// Task 3: Get books by author
public_users.get('/author/:author', (req, res) => {
  const q = req.params.author.toLowerCase();
  const list = Object.keys(books)
    .map(id => ({ isbn: id, ...books[id] }))
    .filter(b => b.author && b.author.toLowerCase().includes(q));
  if (list.length === 0) {
    return res.status(404).send(JSON.stringify({ message: "No books found for this author" }, null, 2));
  }
  return res.status(200).send(JSON.stringify(list, null, 2));
});

// Task 4: Get books by title
public_users.get('/title/:title', (req, res) => {
  const q = req.params.title.toLowerCase();
  const list = Object.keys(books)
    .map(id => ({ isbn: id, ...books[id] }))
    .filter(b => b.title && b.title.toLowerCase().includes(q));
  if (list.length === 0) {
    return res.status(404).send(JSON.stringify({ message: "No books found with this title" }, null, 2));
  }
  return res.status(200).send(JSON.stringify(list, null, 2));
});

// Task 5: Get reviews by ISBN
public_users.get('/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).send(JSON.stringify({ message: "Book not found" }, null, 2));
  return res.status(200).send(JSON.stringify(book.reviews || {}, null, 2));
});

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

const http = axios.create({
    baseURL: "http://127.0.0.1:5000",
    timeout: 5000,             
    proxy: false                     
});

// Task 10: All books via Axios + async/await
public_users.get('/async/books', async (req, res) => {
  try {
    const resp = await axios.get(`${baseUrl(req)}/books`);
    return res.status(200).send(JSON.stringify(resp.data, null, 2));
  } catch (err) {
    const code = err?.response?.status || 500;
    const msg = err?.response?.data || { message: err.message };
    return res.status(code).send(JSON.stringify(msg, null, 2));
  }
});

// Task 11: By ISBN via Axios + Promises (.then/.catch)
public_users.get('/async/isbn/:isbn', (req, res) => {
  axios.get(`${baseUrl(req)}/isbn/${req.params.isbn}`)
    .then(r => res.status(200).send(JSON.stringify(r.data, null, 2)))
    .catch(err => {
      const code = err?.response?.status || 500;
      const msg = err?.response?.data || { message: err.message };
      res.status(code).send(JSON.stringify(msg, null, 2));
    });
});

// Task 12: By author via Axios + async/await
public_users.get('/async/author/:author', async (req, res) => {
  try {
    const resp = await axios.get(`${baseUrl(req)}/author/${encodeURIComponent(req.params.author)}`);
    return res.status(200).send(JSON.stringify(resp.data, null, 2));
  } catch (err) {
    const code = err?.response?.status || 500;
    const msg = err?.response?.data || { message: err.message };
    return res.status(code).send(JSON.stringify(msg, null, 2));
  }
});

// Task 13: By title via Axios + Promises (.then/.catch)
public_users.get('/async/title/:title', (req, res) => {
  axios.get(`${baseUrl(req)}/title/${encodeURIComponent(req.params.title)}`)
    .then(r => res.status(200).send(JSON.stringify(r.data, null, 2)))
    .catch(err => {
      const code = err?.response?.status || 500;
      const msg = err?.response?.data || { message: err.message };
      res.status(code).send(JSON.stringify(msg, null, 2));
    });
});

module.exports.general = public_users;
