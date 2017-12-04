var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  uid: Number,
  id: String,
  name: String,
  pw: String,
  chatRooms: Array,
  type: Number,
  isFirstLg: String,
  gender: String,
  year: String,
  days: String,
  questionnaire1: String,
  questionnaire2: String,
  questionnaire3: String
});

module.exports = mongoose.model("user", userSchema);
