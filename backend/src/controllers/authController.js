const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const asyncHandler = require('express-async-handler');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_jwt_key_here', {
    expiresIn: '30d',
  });
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  // Check if user exists
  const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  if (existingUser.length > 0) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const [result] = await db.execute(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, password_hash, role]
  );

  const token = generateToken(result.insertId, role);

  res.status(201).json({
    id: result.insertId,
    name,
    email,
    role,
    token
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const user = users[0];

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    const token = generateToken(user.id, user.role);
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

module.exports = { register, login };
