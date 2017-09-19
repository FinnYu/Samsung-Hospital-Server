var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  uid: Number,
  id: String,
  name: String,
  pw: String,
});

module.exports = mongoose.model("user", userSchema);
