const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { error, success } = require("../utils/responseWrapper");

const signupController = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      // res.status(400)("Email and Password required");
      res.send(error(400, "All fields are required"));
      return;
    }

    const oldUser = await User.findOne({ email });
    if (oldUser) {
      // res.status(409).send("Email already registered");
      res.send(error(409, "Email already registered"));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    // const newUser = new User({ email, password: hashedPassword });
    // await newUser.save();

    // return res.status(201).json({
    //   user,
    // });

    return res.send(success(201, "user successfully created"));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      // res.status(400).send("Email and Password required");
      res.send(error(400, "Email and Password required"));
      return;
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      // res.status(404).send("User not registered");
      res.send(error(404, "User not registered"));
      return;
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      // res.status(403).send("Incorrect Password");
      res.send(error(403, "Incorrect Password"));
      return;
    }

    const accessToken = generateAccessToken({
      _id: user._id,
    });

    const refreshToken = generateRefreshToken({
      _id: user._id,
    });

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: true,
    });

    // return res.status(200).json({ accessToken });
    return res.send(success(200, { accessToken }));
  } catch (error) {
    console.log(error);
  }
};

//this api will check the refreshToken validity and generate a new accessToken
const refreshAccessTokenController = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies.jwt) {
    // return res.status(401).send("Refresh token in cookie is required");
    return res.send(error(401, "Refresh token in cookie is required"));
  }

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_PRIVATE_KEY
    );

    const _id = decoded._id;
    const accessToken = generateAccessToken({ _id });
    // return res.status(201).json({ accessToken });
    return res.send(success(201, { accessToken }));
  } catch (e) {
    console.log(e);
    // return res.status(401).send("Invalid refresh token");
    return res.send(error(401, "Invalid refresh token"));
  }
};

const logoutController = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: true,
    });
    return res.send(success(200, "user logged out"));
  } catch (e) {
    res.send(error(500, e.message));
  }
};

//internal functions
const generateAccessToken = (data) => {
  try {
    const token = jwt.sign(data, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
      expiresIn: "1d",
    });
    console.log("Access token : ", token);
    return token;
  } catch (error) {
    res.send(error(500, e.message));
  }
};

const generateRefreshToken = (data) => {
  try {
    const token = jwt.sign(data, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
      expiresIn: "1y",
    });
    console.log("Refresh token", token);
    return token;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  signupController,
  loginController,
  refreshAccessTokenController,
  logoutController,
};
