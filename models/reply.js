var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var replySchema = new Schema({
  rid: Number,
  pid: Number,
  author: String,
  contents: String,
});

module.exports = mongoose.model("reply", replySchema);
