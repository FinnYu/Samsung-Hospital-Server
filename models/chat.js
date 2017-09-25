var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var chatSchema = new Schema({
  cid: Number,
  room_id: Number,
  uid: Number,
  type: Number,
  name: String,
  message: String
});

module.exports = mongoose.model("chat", chatSchema);
