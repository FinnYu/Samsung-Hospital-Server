var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  pid: Number,
  uid: Number,
  tid: {type: Number, default: 0},
  author : String,
  memo: String,
  rate: Number,
  pub: Boolean,
  rep: Number,
  like: Array
});

module.exports = mongoose.model("post", postSchema);
