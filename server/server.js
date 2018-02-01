const express = require('express')
const bodyParser = require('body-parser');
const path = require('path');
const expressSession = require('express-session');
require('dotenv').config();

const passport = require('passport');
const Strategy = require('passport-facebook').Strategy;

const db = require('./db').mongoose;
const Exercise = require('./db').exerciseModel;
const User = require('./db').userModel;
const ObjectID = require('mongodb').ObjectID;


const bcrypt = require('bcrypt');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const app = express();

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Passport-Facebook Setup
* * * * * * * * * * * * * * * * * * * * * * * * * * */

passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/login/facebook/return'
},
(accessToken, refreshToken, profile, cb) => {
  process.nextTick(() => {
    User.find({username: profile.displayName}, (err, user) => {
      if (err) {
        console.log("Database access error" + err);
      } else {
        if (!user[0]) {
          var newUser = new User({
            _id: new ObjectID(),
            username: profile.displayName,
            preferences: {}
          });
          newUser.save((err) => {
            if (err) {
              console.log(err);
            } else {
              console.log('User created');
              return cb(null, profile);
            }
          });
        } else {
          console.log('User exists');
          return cb(null, profile);
        }
      }
    });
  });
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Express App Setup
* * * * * * * * * * * * * * * * * * * * * * * * * * */

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

app.use('/public', express.static('client/public'));
app.use('/react', express.static('node_modules/react/dist'));
app.use('/react-dom', express.static('node_modules/react-dom/dist'));
app.use('/jquery', express.static('node_modules/jquery/dist'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

app.listen(process.env.PORT || 3000);

console.log('server is running');

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  API Routes
* * * * * * * * * * * * * * * * * * * * * * * * * * */

app.get('/', (req,res)=> {
  res.sendFile('index.html', { root: 'client/public'});
});
app.get('/workout', getWorkout);
app.get('/history', getHistory);
app.get('/login/facebook',
  passport.authenticate('facebook'));
app.get('/login/facebook/return', 
  passport.authenticate('facebook', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  });

app.post('/addWorkout', addWorkout);
app.post('/login', isLoggedIn, checkLogin);
app.post('/signup', addSignup);

/* * * * * * * * * * * * * * * * * * * * * * * * * * *
  Request Handlers
* * * * * * * * * * * * * * * * * * * * * * * * * * */

function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next();
  }

  // if they aren't redirect them to the home page
  res.redirect('/');
}

function getHistory(req, res) {
  var name = req.query.username;
  User.findOne({username: name}, function(err, data) {
    if(err) {
      console.log('err happened with cooldown retrieval: ' + err);
    } else{
      res.send(data.workoutHistory);
    }
  });
}

function getWorkout(req, res) {
  var returnObj = [];

  Exercise.find({type: 'warmup'}, function(err,data) {
    if(err) {
      console.log('err happened with cooldown retrieval: ' + err);
    } else {
      returnObj.push(data[Math.floor(Math.random()*data.length)]);
      returnObj.push(data[Math.floor(Math.random()*data.length)]);
      returnObj.push(data[Math.floor(Math.random()*data.length)]);

      Exercise.find({type: 'workout'}, function(err,data) {
        if(err) {
          console.log('err happened with cooldown retrieval: ' + err);
        } else {
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);
          returnObj.push(data[Math.floor(Math.random()*data.length)]);

          Exercise.find({type: 'cooldown'}, function(err,data) {
            if(err) {
              console.log('err happened with cooldown retrieval: ' + err);
            } else {
              returnObj.push(data[Math.floor(Math.random()*data.length)]);
              returnObj.push(data[Math.floor(Math.random()*data.length)]);
              returnObj.push(data[Math.floor(Math.random()*data.length)]);

              console.log('exercise data sent succesfully');
              res.status('200').send(returnObj);
            }
          });
        }
      });
    }
  });
}

function addWorkout(req, res) {
  var name = req.body.username;
  var workoutObj = {};
  workoutObj.currentWorkout = req.body.currentWorkout;
  workoutObj.date = req.body.date;
  workoutObj.lengthOfWorkout = req.body.lengthOfWorkout;

  User.findOne({username: name}, function(err, user) {
    if (err) {
      console.log('err happened with cooldown retrieval: ' + err);
    } else {
      user.workoutHistory.unshift(workoutObj);
      user.save(function(err) {
        if (err) {
          console.log(err + ' error happened!');
        } else {
          console.log('user workouts updated');
          res.status(202).send('user workout history updated');
        }
      });
    }
  });
}


function checkLogin(req, res) {
  var name = req.body.username;
  var pass = req.body.password;

  User.findOne({username:name}, function(err, data) {
    if (err) {
      console.log("Database access error" + err);
    } else {
      if (data) {
        if (bcrypt.compareSync(pass, data.password)=== true) {
          res.status(200).send('Log in success');
        } else {
          res.status(400).send('Log in attempt failed');
        }
      } else {
        res.status(400).send('Log in attempt failed');
      }
    }
  });
}

function addSignup(req, res) {
  var name = req.body.username;
  var pass = req.body.password;
  var hash = bcrypt.hashSync(pass, salt);
  var id = new ObjectID();

  User.find({username: name}, function(err, user) {
    if (err) {
      console.log("Database access error" + err);
    } else {
      if (!user[0]) {
        var newUser = new User({
          _id: id,
          username: name,
          password: hash,
          preferences: {}
        });
        newUser.save(function(err) {
          if (err) {
            console.log(err);
          } else {
            res.status(200).send('User Created');
          }
        });
      } else {
        res.status(400).send('User exsists');
      }
    }
  });
}
