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

var validate = function(from, to, target) {
  var time = moment().unix();
  console.log(time);

  if (from > target || target > to) return false;
  else return true;
};

var server = express().listen(5951);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  console.log("QQQ");
  socket.on('new message', function (uid, room_id, name, message) {

    var options = { upsert: true, new: true, setDefaultsOnInsert: true };
    Room.findOneAndUpdate({room_id: room_id}, {$inc: {last_cid: 1}}, function(err, result) {
      if (err) throw err;

      // var time = moment().unix();
      // if (!validate(result.from, result.to, time)) {
      //   res.json({message: 'failure'});
      //   return;
      // }

      var newChat = new Chat();

      newChat.cid = result.last_cid;
      newChat.room_id = room_id;
      newChat.uid = uid;
      newChat.name = name;
      newChat.message = message;

      newChat.save(function (err) {
        if (err) throw err;
      });

      io.sockets.in(room_id.toString()).emit('new message', {
        'name': name,
        'message': message
      });
    });
  });

  socket.on('join', function(data){
    socket.room = data;
    socket.join(data);
    console.log(data);
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

    console.log(req.body);

    if (result == null)
      newRoom.room_id = 1;
    else
      newRoom.room_id = result.room_id;

    newRoom.cre_uid = req.body.uid;
    newRoom.from = req.body.from;
    newRoom.to = req.body.to;
    newRoom.name = req.body.name;
    newRoom.desc = req.body.desc;
    newRoom.pw = req.body.pw;
    newRoom.last_cid = 0;
    newRoom.users = [newRoom.cre_uid];

    newRoom.limit = req.body.limit + 0;

    console.log(newRoom);

    newRoom.save(function (err) {
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

    if (req.body.pw + 0 != 0)
      result.pw = req.body.pw;
      
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
  Room.find({}, function(err, result) {
    if (err) throw err;
    console.log(result);
    res.json({
      message: 'success',
      result: result
    });
  });
});

router.get('/chatList', function (req, res, next) {
  var room_id = req.query.room_id;
  Chat.find({room_id: room_id}, {name: true, message: true},function(err, result) {
    if (err) throw err;
    console.log(result);
    res.json({
      message: 'success',
      result: result
    });
  });
});

module.exports = router;
