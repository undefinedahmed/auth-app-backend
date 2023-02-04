const jwt = require("jsonwebtoken");
const { jwtRefresh, jwtSecret } = require("../../config");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtSecret,
    {
      expiresIn: "1h",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    jwtRefresh
  );
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
