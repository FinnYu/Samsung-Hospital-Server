var express = require('express');
var router = express.Router();
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');

const User = require('../models/user.js');
const Id = require('../models/id.js');

router.get('/login/user', function (req, res, next) {
  var id = req.query.id;
  var pw = req.query.pw;

  User.findOne({id: req.query.id}, function(err, user) {
    if (err) throw err;

    if (user == null) {
      res.json({
        message: 'failure',
        type: 'ID_NOTFOUND'
      });
      return;
    }

    console.log(user)
    if (bcrypt.compareSync(pw, user.pw)) {
      delete user.pw
      res.json({
        message: "success",
        result: user
      });
    } else {
      res.json({
        message: 'failure',
        type: 'PW_UNMATCHED'
      });
      return;
    }
  })
});


router.get('/info/user', function (req, res, next) {

  User.findOne({uid: req.query.uid}, function(err, user) {
    if (err) throw err;

    if (user == null) {
      res.json({
        message: 'failure',
        type: 'ID_NOTFOUND'
      });
      return;
    }

    delete user.pw
    res.json({
      message: "success",
      result: user
    });
  })
});

router.get('/setInfo/user', function(req, res, next) {
  var uid = req.query.uid;
  var name = req.query.name;

  User.findOne({uid: uid}, function (err, user) {
    if (err) throw err;

    user.name = name;
    user.save(function (err) {
      if (err) throw err;
      res.json({
        message: 'success',
        result: user
      });
    });
  });
});

router.get('/signup/user', function (req, res, next) {
  var id = req.query.id;
  var pw_hash = bcrypt.hashSync(req.query.pw);
  var create_time = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  var name = req.query.name;
  var isError = false;

  if (id == null) {
    res.json({
      message: 'failure',
      type: 'EMPTY_ID'
    });
    return;
  }

  User.findOne({id: req.query.id}, function(err, user) {
    if (err) throw err;

    if (user != null) {
    if (user.id == id) {
        res.json({
          message: 'failure',
          type: 'ID_EXISTS'
        });
      }

      isError = true;
      return;
    }

    if (!isError) {

      var options = { upsert: true, new: true, setDefaultsOnInsert: true };
      Id.findOneAndUpdate({}, {$inc: {uid: 1}}, options, function(err, result) {

        var newUser = new User();

        if (result == null)
          newUser.uid = 1;
        else
          newUser.uid = result.uid;

        newUser.id = id;
        newUser.pw = pw_hash;
        newUser.name = name;
        newUser.type = 1;
        newUser.chatRooms = [];

        newUser.save(function (err) {
          if (err) throw err;
          res.json({
            message: 'success'
          });
        });
      });
    }
  });
});

module.exports = router;
