var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
  pid: Number,
  uid: Number,
  author : String,
  memo: String,
  rate: Number,
  pub: Boolean,
  rep: Number,
  like: Array
});

module.exports = mongoose.model("post", postSchema);
