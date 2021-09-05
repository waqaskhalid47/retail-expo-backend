const express = require("express");
let router = express.Router();
var { User } = require("../../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const validateNewUser = require("../../middlewares/validateUser");
const validateUser = require("../../middlewares/validatelogin");

router.post("/register", validateNewUser, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });

  if (user) return res.status(400).send("User already exists");

  user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.password = req.body.password;

  await user.generateHashedPassword();
  await user.save();
  let token = jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    config.get("jwtprivatekey")
  );

  returnData = { name: user.name, email: user.email, token: token };
  return res.send(returnData);
});

router.post("/login", validateUser, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Username doesn't exist");
  let isValid = await bcrypt.compare(req.body.password, user.password);
  if (!isValid) return res.status(400).send("Password incorrect!");
  let token = jwt.sign(
    { id: user._id, name: user.name, role: user.role },
    config.get("jwtprivatekey")
  );
  return res.send(token);
});

module.exports = router;
