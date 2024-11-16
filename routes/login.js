const bcrypt = require("bcrypt");
const Joi = require("joi");
const express = require("express");
const { User } = require("../models/user");
const router = express.Router();
const config = require("config");
const axios = require("axios");
router.post("/", async (req, res) => {
  // Validate request
  const error = await validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Find user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password.");

  // Verify password
  const isValidPassword = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isValidPassword)
    return res.status(400).send("Invalid email or password.");

  // Check role access
  const hasAccess = [
    "superAdmin",
    "panoramaAdmin",
    "contentAdmin",
    "accountManager",
  ].includes(user.role);
  if (!hasAccess)
    return res.status(403).send("You are not allowed to access this resource.");

  // Fetch IP address
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  console.log(ipAddress);
  // Fetch location data using GeoIPify API
  let locationData = {};
  try {
    const response = await axios.get(
      `https://geo.ipify.org/api/v2/country,city`,
      {
        params: {
          apiKey: config.get("GEOIPIFY_API_KEY"), // Replace with your GeoIPify API key
          ipAddress,
        },
      }
    );
    const geoData = response.data.location;
    locationData = {
      country: geoData.country || "Unknown",
      region: geoData.region || "Unknown",
      city: geoData.city || "Unknown",
      lat: geoData.lat || null,
      lon: geoData.lng || null,
      timezone: geoData.timezone || "Unknown",
    };
  } catch (err) {
    console.error("Error fetching location data:", err.message);
    locationData = {
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
      lat: null,
      lon: null,
      timezone: "Unknown",
    };
  }

  // Append login history
  user.loginHistory.push({
    ipAddress,
    location: locationData,
  });

  
  // Generate token
  const token = user.generateAuthToken();
  user.accessToken = token;

  // Save user
  await user.save();

  // Send response
  res.header("x-auth-token", token).send("Login Successful.");
});

async function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(8).max(255).required(),
  });

  try {
    await schema.validateAsync(req);
  } catch (err) {
    return err;
  }
}

module.exports = router;
