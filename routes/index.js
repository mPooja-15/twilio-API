let express = require('express');
let router = express.Router();
const User = require('../models/User');

router.post('/users', function (req, res) {
    const data = req.body;
    // Create a new user based on form parameters
    const user = new User({
        phone: data.phone,
        countryCode: '91',
    });

    user.save(function (err, doc) {
        if (err) {
            res.json(err);
        } else {
            // If the user is created successfully, send them an account verification token
            user.sendAuthyToken(function (err, data) {
                if (err) {
                    res.json(err);
                }
                // Send to token verification page
                res.json({ message: "user successfully registered", data: doc });
            });
        }
    });
});

router.post('/users/:id/verify', function (req, res) {
    let user = {};
    User.findById(req.params.id, function (err, doc) {
        if (err || !doc) {
            return die('User not found for this ID.');
        }
        // If we find the user, let's validate the token they entered
        user = doc;
        user.verifyAuthyToken(req.body.code, postVerify);
    });

    // Handle verification res
    function postVerify(err) {
        if (err) {
            return res.json('The token you entered was invalid - please retry.');
        }
        // If the token was valid, flip the bit to validate the user account
        user.verified = true;
        user.save(postSave);
    }

    // after we save the user, handle sending a confirmation
    function postSave(err) {
        if (err) {
            return res.json('There was a problem validating your account please enter your token again.');
        }

        // Send confirmation text message
        const message = 'You did it! Signup complete :)';
        user.sendMessage(message, function () {
            res.json(doc);
        }, function (err) {
        });
    }
  
});


module.exports = router;