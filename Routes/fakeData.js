const router = require("express").Router();
const axios = require("axios");

const middleware = require("../Utils/Middleware");

/**
 * @purpose checks role in the access token
 * @return list of todos if role is user else returns list of users if role is admin
 */
router.get("/get-data", middleware.authenticateToken, async (req, res) => {
  try {
    await axios
      .get(
        `https://jsonplaceholder.typicode.com/${
          req.user.role === "admin" ? "users" : "todos"
        }`
      )
      .then((resp) => res.status(200).send(resp.data))
      .catch((error) =>
        res.status(500).json({ message: "OOPS! Error in req", error })
      );
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

module.exports = router;
