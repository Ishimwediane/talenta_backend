// middleware/tryAuthenticateToken.js

import jwt from 'jsonwebtoken';

export const tryAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If there's no token, we just continue without a user attached
  if (token == null) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // If the token is invalid (e.g., expired), we also just continue.
    // We don't throw an error because this is an optional check.
    if (err) {
      return next();
    }

    // If the token is valid, attach the user to the request
    req.user = user;
    next();
  });
};