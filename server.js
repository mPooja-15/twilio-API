const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const { URL } = require("./config/db")

// Connecting to the local database
mongoose.connect(URL).then(() => {
    console.log("successfully database connected")
});
app.use(express.json());

app.use(bodyParser.urlencoded({
    extended: true,
}));

let index = require('./routes/index');

// Specifying the routes
app.use('/', index);

// Use of express session
app.use(session({
    secret: 'I am secret',
    resave: true,
    saveUninitialized: true,
}));


app.listen(4000, function () {
    console.log('Running at port ' + 4000);
});
