var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var idSchema = new Schema({
    uid: Number,
    pid: Number,
    rid: Number,
    room_id: Number,
});

module.exports = mongoose.model("id", idSchema);
