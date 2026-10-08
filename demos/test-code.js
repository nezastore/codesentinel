// Test file for CodeSentinel demo
// This code intentionally has bugs for testing purposes

// BUG 1: SQL Injection vulnerability
function getUser(userId) {
  const query = 'SELECT * FROM users WHERE id = ' + userId;
  return db.query(query);
}

// BUG 2: Exposing sensitive data
function logUser(user) {
  console.log('User logged in:', user.password);
}

// BUG 3: Unhandled promise rejection
async function fetchData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// BUG 4: Race condition
let counter = 0;
function increment() {
  counter++;
  setTimeout(() => {
    console.log(counter); // Can print unexpected value
  }, 100);
  counter++;
}

// BUG 5: Memory leak
const cache = {};
function addToCache(key, value) {
  cache[key] = value;
  // No eviction - cache grows forever
}

// BUG 6: N+1 query problem
function getAllUsersWithPosts() {
  const users = db.query('SELECT * FROM users');
  users.forEach(user => {
    user.posts = db.query('SELECT * FROM posts WHERE user_id = ' + user.id);
  });
  return users;
}

// BUG 7: XSS vulnerability
function displayComment(comment) {
  document.getElementById('comments').innerHTML = comment;
}

// BUG 8: Null pointer
function processOrder(order) {
  order.items.forEach(item => {
    item.price = item.price * 1.1; // What if item is null?
  });
}

// BUG 9: Weak password hashing
const bcrypt = require('bcryptjs');
async function createUser(password) {
  const hash = password.split('').reverse().join(''); // Terrible hashing
  return db.saveUser({ password: hash });
}

// BUG 10: Hardcoded secrets
const API_KEY = 'sk_live_abc123xyz789secretkey';
const DB_PASSWORD = 'admin123';
