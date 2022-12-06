const mongoose = require("mongoose");

const authy = require("authy")("193SiEJzixPPdxkXEGLxxj4dWUpzqahV");
const twilioClient = require("twilio")(
  "AC7fbd21a561a59917e572543b613bbd80",
  "405d4b9d85e4118627287ae5893cd8cc"
);

// For hashing password

// Define user model schema
const UserSchema = new mongoose.Schema({
  countryCode: {
    type: String,
  },
  phone: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["FARMER", "BUYER", "DEALER", "RETAILER"],
    default: "BUYER",
  },
  authyId: String,
});

// Send a verification token to this user
UserSchema.methods.sendAuthyToken = function (cb) {
  let self = this;

  if (!self.authyId) {
    // Register this user if it's a new user
    authy.register_user(self.email, self.phone, "91", function (err, response) {
      if (err || !response.user) return cb.call(self, err);
      self.authyId = response.user.id;
      self.save(function (err, doc) {
        if (err || !doc) return cb.call(self, err);
        self = doc;
        sendToken();
      });
    });
  } else {
    // Otherwise send token to a known user
    sendToken();
  }

  // With a valid Authy ID, send the 2FA token for this user
  function sendToken() {
    authy.request_sms(self.authyId, true, function (err, response) {
      cb.call(self, err);
    });
  }
};

// Test a 2FA token
UserSchema.methods.verifyAuthyToken = function (otp, cb) {
  const self = this;
  authy.verify(self.authyId, otp, function (err, response) {
    cb.call(self, err, response);
  });
};

// Send a text message via twilio to this user
UserSchema.methods.sendMessage = function (
  message,
  successCallback,
  errorCallback
) {
  const self = this;
  const toNumber = `+${self.countryCode}${self.phone}`;
  twilioClient.messages
    .create({
      to: toNumber,
      from: "+15105193495",
      body: message,
    })
    .then(function (data) {
      console.log(data);
      successCallback();
    })
    .catch(function (err) {
      errorCallback(err);
    });
};

// Export user model
module.exports = mongoose.model("User", UserSchema);
