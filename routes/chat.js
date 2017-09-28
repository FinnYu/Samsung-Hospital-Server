var express = require('express');
var router = express.Router();
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');

const User = require('../models/user.js');
const Room = require('../models/room.js');
const Chat = require('../models/chat.js');
const Id = require('../models/id.js');

var baseTime = 1505574000; // moment('2017-09-17T00:00:00') 의 .unix() 값

// 현재 채팅에서 사용가능한 룸 목록을 저장할 변수

var validate = function(from, to) {
  var time = moment().unix() - baseTime;
  console.log(from);
  console.log(time);
  console.log(to);
  if (from > time || time > to) return false;
  else return true;
};

var server = express().listen(5951);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  socket.on('new message', function (uid, room_id, name, type, message) {

    var options = { upsert: true, new: true, setDefaultsOnInsert: true };
    Room.findOneAndUpdate({room_id: room_id}, {$inc: {last_cid: 1}}, function(err, room) {
      if (err) throw err;

      if (!validate(room.from, room.to))
        return;

      var newChat = new Chat();

      newChat.cid = room.last_cid;
      newChat.room_id = room_id;
      newChat.uid = uid;
      newChat.name = name;
      newChat.type = type;
      newChat.message = message;

      newChat.save(function (err) {
        if (err) throw err;
      });

      io.sockets.in(room_id.toString()).emit('new message', {
        'uid': uid,
        'name': name,
        'type': type,
        'message': message
      });

      var time = moment().unix() - baseTime;
      if (type == 2) {
        room.hws.push({
            tid: message,
            time: time,
            done: []
          });
        room.save(function (err){
          if(err) throw err;
        });
      }
    });
  });

  socket.on('join', function(data){
    socket.room = data;
    socket.join(data);
    console.log(data);
  });

  socket.on('read', function(uid, room_id){
    Room.findOne({room_id: room_id}, function(err, room) {
      if (err) throw err;

      for (i = 0; i < room.users.length; i ++) {
        if (room.users[i].uid == uid) {
          var user = room.users[i];
          user.last_cid = room.last_cid;

          room.users.set(i, user);
          room.save(function (err) {
            if (err) throw err;
          });
          break;
        }
      }
    });
  });

  // 사용자가 접속을 끊을 경우 처리할 리스너 함수
  socket.on('left', function(){
    socket.leave(socket.room);
  });
});

router.post('/makeRoom', function (req, res, next) {
  var options = { upsert: true, new: true, setDefaultsOnInsert: true };
  Id.findOneAndUpdate({}, {$inc: {room_id: 1}}, options, function(err, result) {
    var newRoom = new Room();

    if (req.body.pw + 0 == 0) {
      res.json({
        message: 'failure',
        detail: 'pw not entered'
      });
      return;
    }

    if (result == null)
    newRoom.room_id = 1;
    else
    newRoom.room_id = result.room_id;

    newRoom.cre_uid = req.body.uid;
    newRoom.from = req.body.from;
    newRoom.to = req.body.to;
    newRoom.name = req.body.name;
    newRoom.desc = req.body.desc;
    var pw_hash = bcrypt.hashSync(req.body.pw);
    newRoom.pw = pw_hash;
    newRoom.last_cid = 0;
    newRoom.users = [{
      uid : req.body.uid,
      name : req.body.username,
      last_cid : 0
    }];

    if (req.body.limit > 0)
    newRoom.limit = req.body.limit;
    else
    newRoom.limit = 0;

    User.findOne({uid: req.body.uid}, function(err, user) {
      if (err) throw err;

      user.chatRooms.push(newRoom.room_id);
      user.save(function(err) {
        if (err) throw err;
      });

      newRoom.save(function (err) {
        if (err) throw err;
        res.json({
          message: 'success'
        });
      });
    });
  });
});

router.post('/joinRoom', function (req, res, next) {
  var room_id = req.body.room_id;
  var uid = req.body.uid;
  var name = req.body.name;
  var pw = req.body.pw;

  Room.findOne({room_id: req.body.room_id}, function(err, result) {

    if (result == null) throw err;
    if (result.limit != 0 && result.users.length >= result.limit) {
      res.json({
        message: 'failure',
        detail: 'user limit exceed'
      });
      return;
    }

    if (!bcrypt.compareSync(pw, result.pw)) {
      res.json({
        message: 'failure',
        detail: 'pw incorrect'
      });
      return;
    }

    User.findOne({uid: req.body.uid}, function(err, user) {
      if (err) throw err;
      if (user.chatRooms == undefined)
      user.chatRooms = [];
      user.chatRooms.push(room_id);
      user.save(function(err) {
        if (err) throw err;
      });
    });

    result.users.push({
      uid : uid,
      name : name,
      last_cid : 0
    });

    result.save(function (err) {
      if (err) throw err;
      res.json({
        message: 'success'
      });
    });
  });
});

router.post('/changeRoom', function (req, res, next) {
  Room.findOne({room_id: req.body.room_id}, function(err, result) {

    if (result == null) throw err;

    result.from = req.body.from;
    result.to = req.body.to;
    result.name = req.body.name;
    result.desc = req.body.desc;
    result.last_cid = req.body.last_cid;

    if (req.body.pw + 0 != 0) {
      var pw_hash = bcrypt.hashSync(req.body.pw);
      result.pw = pw_hash;
    }

    result.limit = req.body.limit + 0;

    console.log(result);

    result.save(function (err) {
      if (err) throw err;
      res.json({
        message: 'success'
      });
    });
  });
});

router.post('/deleteRoom', function (req, res, next) {
  Room.remove({room_id: req.body.room_id}, function(err, result) {
    console.log(err);
    if (err) throw err;
    res.json({
      message: 'success'
    });
  });
});

router.get('/roomList', function (req, res, next) {
  var name = req.query.name;

  if (name.length > 0)
    name = name.trim();

  if (name.length <= 0)
  {
    var currentTime = time(moment().unix());
    Room.find({}, function(err, result) {
        if (err) throw err;
        res.json({
          message: 'success',
          result: result
        });
      });
    }
  else {
    var regex = '/*' + name + '/*';
    Room.find({
      name: new RegExp(regex)
    }, function(err, result) {
      console.log(result);
      if (err) throw err;
      res.json({
        message: 'success',
        result: result
      });
    });
  }
});

router.get('/myRooms', function (req, res, next) {
  var uid = req.query.uid;
  User.findOne({uid: uid}, function(err, user){
    if (err) throw err;

    Room.find({
      room_id: {
        $in: user.chatRooms
      }
    }, function(err, result) {
      if (err) throw err;
      res.json({
        message: 'success',
        result: result
      });
    });
  });
});

router.get('/getRoom', function (req, res, next) {
  var room_id = req.query.room_id;

  Room.findOne({room_id: room_id}, function(err, room){
    if (err) throw err;

    res.json({
      message: 'success',
      result: room
    })
  });
});

router.get('/chatList', function (req, res, next) {
  var room_id = req.query.room_id;
  Chat.find({room_id: room_id}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.json({
      message: 'success',
      result: result
    });
  });
});

module.exports = router;
