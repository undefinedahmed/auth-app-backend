const router = require("express").Router();
var mongoose = require("mongoose");
const User = require("../Models/User");

const middleware = require("../Utils/Middleware");

/**
 * @returns user data that is filtered by mongoose id
 */
router.get("/get-data", middleware.authenticateToken, async (req, res) => {
  try {
    var id = mongoose.Types.ObjectId(req.user.id);
    User.findById(id, function (err, docs) {
      if (err) {
        console.error(err);
        return res.status(404).json({ message: "User not found", err });
      } else {
        return res.status(200).json({
          userData: {
            name: docs.name,
            email: docs.email,
            phone: docs.phone,
            gender: docs.gender,
          },
        });
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Something went wrong!" });
  }
});

module.exports = router;
