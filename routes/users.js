const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const {forwardAuthenticated} = require('../config/auth')

router.get('/login', forwardAuthenticated, (req, res) => {
    res.render("login.ejs");
});

router.get('/register', forwardAuthenticated, (req, res) => {
    res.render("register.ejs");
});

router.post('/register', (req, res) => {
    const {name, email, password, password2} = req.body;

    let errors = [];

    // Check required Fields
    if(!name || !email || !password || !password2){
        errors.push({msg : "Please all of the fields"});
    }

    // Check password match
    if(password !== password2){
        errors.push({msg : "Passwords do not match"});
    }

    //Check pass Length
    if(password.length < 6){
        errors.push({msg : "Password should be atleast 6 characters"});
    }

    if(errors.length > 0){
        res.render("register.ejs", {
            errors,
            name, 
            email,
            password,
            password2
        });
    }else{
        //Validation Passed
        User.findOne({email : email})
        .then(user => {
            if(user){
                //User exists
                errors.push({msg: "Email is already registered"});
                res.render("register.ejs", {
                    errors,
                    name, 
                    email,
                    password,
                    password2
                });
            }else{
                const newUser = new User({
                    name,
                    email,
                    password
                });
               
                // Hashing the Password
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if(err) throw err;

                        //Set Password to Hash
                        newUser.password = hash;
                        
                        //save User
                        newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'You are now registered');
                            res.redirect('/users/login');
                        })
                        .catch(err => console.log(err));
                    });
                });
            }
        })
    }
})

//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

});

//Logout Handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');

});

module.exports = router;