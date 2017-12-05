var express = require('express');
var router = express.Router();
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');

const Id = require('../models/id');
const User = require('../models/user')
const Post = require('../models/post');
const Reply = require('../models/reply');
const Room = require('../models/room')

router.get('/uploads', function (req, res){
  file = req.query.file;
  var dirname = "images";
  console.log(file);
  var img = fs.readFileSync(dirname + "/uploads/" + file);
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');

});

var baseTime = 1505574000; // moment('2017-09-17T00:00:00') 의 .unix() 값

router.post('/upload', function(req, res) {
  var uid = req.body.uid;
  var memo = req.body.memo;
  var star = req.body.star;
  var pub = req.body.public;
  var tid = req.body.tid;

  fs.readFile(req.files.image.path, function (err, data){
    var options = { upsert: true, new: true, setDefaultsOnInsert: true };

    Id.findOneAndUpdate({}, {$inc: {pid: 1}}, options, function(err, result) {
      var newPost = new Post();
      newPost.pid = result.pid;
      newPost.uid = uid;
      newPost.memo = memo;
      newPost.rate = star;
      newPost.pub = pub;
      newPost.tid = tid;
      newPost.rep = 0;
      newPost.time = moment().unix() - baseTime;

      User.findOne({uid: uid}, function(err, user) {
        if (err) throw err;

        newPost.author = user.name;

        var dirname = "images";
        var newPath = dirname + "/uploads/" + newPost.pid + ".jpg";
        fs.writeFile(newPath, data, function (err) {
          if (err) throw err;
        });

        newPost.save(function (err) {
          if(err){
            res.json({message: 'fail'});
            return;
          }else {
            res.json({message: 'success'});
          }

          Room.find({
            room_id: {
              $in: user.chatRooms
            }
          }, function(err, room) {
            if (err) throw err;

            for (i = 0 ; i < room.length ; i ++)
            {
              room[i].hws.sort(function (a, b) {
                return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
              });

              var elem = {uid: uid, name: user.name};
              for (j = 0 ; j < room[i].hws.length; j ++)
              {
                if (room[i].hws[j].tid == tid && room[i].hws[j].done.findIndex(k => k.uid == uid) == -1)
                {
                  var target = room[i].hws[j];
                  target.done.push(elem);
                  room[i].hws.set(j, target);

                  room[i].save(function (err) {
                    if (err) throw err;
                  });
                  break;
                }
              }
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

      newReply.pid = pid;
      newReply.author = result.name;
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
      res.json({message: 'success', result: result});
    });
  } else {
    Post.find({pub: 'true'}).sort({pid: -1}).exec(function (err, result) {
      if (err) throw err;
      res.json({message: 'success', result: result});
    });
  }
});

router.get('/remove', function(req, res) {
  var uid = req.query.uid;
  var pid = req.query.pid;

  Post.findOne({pid: pid}).remove().exec(function (err, result) {
    if (err) throw err;
    res.json({message: 'success'});
  });
});


router.get('/search', function (req, res, next) {
  var uid = req.query.uid;
  var memo = req.query.name;
  var pub = req.query.pub;

  if (memo.length > 0)
    memo = memo.trim();

  if (memo.length > 0)
  {
    var regex = '/*' + memo + '/*';
    var cond;
    if (pub == 'false') {
      cond = {memo: new RegExp(regex), uid: uid};
    }
    else {
      cond = {memo: new RegExp(regex), pub: true};
    }

    Post.find(cond, function(err, result) {
      console.log(result);
      if (err) throw err;
      res.json({
        message: 'success',
        result: result
      });
    });
  }
  else {
    res.json({
      message: 'success',
      result: []
    });
  }
});

module.exports = router;
