const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../../config");

module.exports = {
  authenticateToken: function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    // splitting the header because of bearer keyword
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "header not found" });

    jwt.verify(token, jwtSecret, (error, user) => {
      if (error)
        return res.status(403).json({ message: "Access Denied!", error });

      // sending user object in request
      req.user = user;
      next();
    });
  },
};
