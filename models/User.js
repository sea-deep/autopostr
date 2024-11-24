const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskID: { type: String, required: false },
  driveURL: { type: String, required: true },
  dailyLimit: { type: Number, required: true },
  todayUploaded: { type: Number, default: 0 },
  totalUploaded: { type: Number, default: 0 },
  nextUploadTime: { type: Date, required: false },
  title: { type: String, required: false, default: ""},
  description: { type: String, required: false, default: ""},
  tags: { type: [String], default: [] }
});


const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true },
  name: { type: String, required: true, default: "noname" },
  email: { type: String, required: true },
  accessToken: { type: String, required: false },
  refreshToken: { type: String, required: false },
  tasks: [taskSchema]
});

module.exports = mongoose.model('User', userSchema);
