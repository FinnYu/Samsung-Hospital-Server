var express = require('express');
var router = express.Router();
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');

const Id = require('../models/id.js');
const User = require('../models/user')
const Post = require('../models/post.js');
const Reply = require('../models/reply.js');

router.get('/uploads', function (req, res){
  file = req.query.file;
  var dirname = "images";
  console.log(file);
  var img = fs.readFileSync(dirname + "/uploads/" + file);
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');

});


router.get('/upload', function (req, res){
  var uid = req.query.uid;
  var memo = req.query.memo;
  var star = req.query.star;
  var pub = req.query.public;


  var options = { upsert: true, new: true, setDefaultsOnInsert: true };

  Id.findOneAndUpdate({}, {$inc: {pid: 1}}, options, function(err, result) {
    var newPost = new Post();
    newPost.pid = result.pid;
    newPost.uid = uid;
    newPost.memo = memo;
    newPost.rate = star;
    newPost.pub = pub;
    newPost.rep = 0;

    User.findOne({uid: uid}, function(err, result) {
      if (err) throw err;

      newPost.author = result.name;

      newPost.save(function (err) {
        if (err) throw err;

        var dirname = "images";
        var newPath = dirname + "/uploads/" + newPost.pid + ".jpg";
        res.json({message: 'success'});
      });
    });
  });
});

router.post('/upload', function(req, res) {
  var uid = req.query.uid;
  var memo = req.query.memo;
  var star = req.query.star;
  var pub = req.query.public;

  fs.readFile(req.files.image.path, function (err, data){

    var options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Id.findOneAndUpdate({}, {$inc: {pid: 1}}, options, function(err, result) {
      var newPost = new Post();
      newPost.pid = result.pid;
      newPost.uid = uid;
      newPost.memo = memo;
      newPost.rate = star;
      newPost.pub = pub;
      newPost.rep = 0;

      User.findOne({uid: uid}, function(err, result) {
        if (err) throw err;

        newPost.author = result.name;

        newPost.save(function (err) {
          if (err) throw err;

          var dirname = "images";
          var newPath = dirname + "/uploads/" + newPost.pid + ".jpg";
          fs.writeFile(newPath, data, function (err) {
            if(err){
              res.json({message: 'fail'});
            }else {
              res.json({message: 'success'});
            }
          });
        });
      });
    });
  });
});

router.get('/reply', function(req, res) {
  var uid = req.query.uid;
  var pid = req.query.pid;
  var contents = req.query.contents;

  var options = { upsert: true, new: true, setDefaultsOnInsert: true };
  Id.findOneAndUpdate({}, {$inc: {rid: 1}}, options, function(err, result) {
    if (err) throw err;

    var newReply = new Reply();
    newReply.rid = result.rid;
    User.findOne({uid: uid}, function(err, result) {
      console.log(result.name);

      newReply.pid = pid;
      newReply.author = result.name;
      console.log(newReply.author);
      newReply.contents = contents;

      Post.findOneAndUpdate({pid: pid}, {$inc: {rep: 1}}, function(err, result) {
        if (err) throw err;
      });

      newReply.save(function (err) {
        if (err) throw err;
        res.json({message: 'success'});
      });
    });
  });
});


router.get('/replylist', function(req, res) {
  var pid = req.query.pid;

  Reply.find({pid: pid}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.json({
      message: 'success',
      result: result
    });
  });
});

router.get('/like', function(req, res) {
  var uid = req.query.uid;
  var pid = req.query.pid;

  Post.findOne({pid: pid}, function(err, result) {
    if (err) throw err;

    var index = result.like.indexOf(uid);
    if (index != -1) {
      result.like.splice(index, 1);
    } else {
      result.like.push(uid);
    }

    result.save(function (err){
      if (err) throw err;
    });

    res.json({message: 'success'});
  });
});

router.get('/lists', function(req, res) {
  var uid = req.query.uid;
  var personal = req.query.personal;
  var last = req.query.last;

  if (personal == 'true') {
    Post.find({uid: uid}).sort({pid: -1}).exec(function (err, result) {
      if (err) throw err;
      console.log(result);
      res.json({message: 'success', result: result});
    });
  } else {
    Post.find({pub: 'true'}).sort({pid: -1}).exec(function (err, result) {
      if (err) throw err;
      res.json({message: 'success', result: result});
    });
  }
});


module.exports = router;
