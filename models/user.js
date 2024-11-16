const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");
const Joi = require("joi");
const _ = require("lodash");

const userSchema = new mongoose.Schema(
  {
    // login details

    first_name: {
      type: String,
      minlength: 2,
      maxlength: 255,
      trim: true,
      required: true,
    },
    last_name: {
      type: String,
      minlength: 2,
      maxlength: 255,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      minlength: 5,
      maxlength: 255,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },

    otp: {
      code: {
        type: String,
        minlength: 4,
        maxlength: 1024,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    password: {
      type: String,
      minlength: 8,
      maxlength: 1024,
      trim: true,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value) {
          // Calculate the age based on the provided date
          const today = new Date();
          const age = today.getFullYear() - value.getFullYear();
          const monthDiff = today.getMonth() - value.getMonth();
          const dayDiff = today.getDate() - value.getDate();

          // Adjust age if the birthday hasn't occurred yet this year
          return (
            age > 18 ||
            (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)))
          );
        },
        message: "You must be at least 18 years old.",
      },
      required: true,
    },

    role: {
      type: String,
      enum: [
        "superAdmin",
        "panoramaAdmin",
        "contentAdmin",
        "accountManager",
        "consumerParent",
        "consumerChild",
        "consultant",
        "referralPartner",
        "user",
      ],
      default: "user",
    },

    accessToken: {
      type: String,
      maxlength: 1024,
    },
    loginHistory: [
        {
            ipAddress: { type: String, required: true }, // Stores the client's IP address
            location: {
                country: { type: String },   // e.g., "United States"
                region: { type: String },    // e.g., "California"
                city: { type: String },      // e.g., "Los Angeles"
                lat: { type: Number },       // Latitude
                lon: { type: Number },       // Longitude
                timezone: { type: String },  // e.g., "America/Los_Angeles"
            },
            loggedAt: { type: Date, default: Date.now } // Timestamp of the login
        }
    ],

  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },

    config.get("jwtPrivateKey")
  );

  return token;
};

const User = mongoose.model("User", userSchema);

async function validateUser(user) {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(255).required(),
    last_name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(5).max(255).email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).max(255).required(),
    dateOfBirth: Joi.date(),
    role: Joi.string().min(3).max(15),
  });

  try {
    await schema.validateAsync(user);
  } catch (err) {
    return err;
  }
}

async function validateUserOnUpdate(user) {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(255).required(),
    last_name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(5).max(255).email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).max(255).required(),
    dateOfBirth: Joi.date(),
    role: Joi.string().min(3).max(15),
  });

  try {
    await schema.validateAsync(user);
  } catch (err) {
    return err;
  }
}

async function validateMeOnUpdate(user) {
  const schema = Joi.object({
    first_name: Joi.string().min(2).max(255).required(),
    last_name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(5).max(255).email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).max(255).required(),
    dateOfBirth: Joi.date(),
    role: Joi.string().min(3).max(15),
  });

  try {
    await schema.validateAsync(user);
  } catch (err) {
    return err;
  }
}


exports.User = User;
exports.validate = validateUser;
exports.validateOnUpdate = validateUserOnUpdate;
exports.validateMeOnUpdate = validateMeOnUpdate;
