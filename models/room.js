var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
  room_id: Number,
  cre_uid: Number,
  from: Number,
  to: Number,
  name: String,
  desc: String,
  pw: String,
  limit: Number,
  last_cid: Number,
  users: Array,
});

module.exports = mongoose.model("room", roomSchema);
