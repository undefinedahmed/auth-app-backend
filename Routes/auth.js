const router = require("express").Router();
const { check, validationResult } = require("express-validator");
const User = require("../Models/User");

router.post("/reset-password", (req, res) => {
  res.send({ msg: "han bhae kia haal hain?" });
});

router.post(
  "/forgot-password",
  [check("email", "Invalid Email!").isEmail()],
  async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).send("Email is required!");
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).send({ message: "Woops! User Not found." });
      }
      // TODO: send an otp to user with a few minutes of validation
    } catch (e) {
      console.error("Error inside forgot password: ", e);
    }
  }
);

module.exports = router;
