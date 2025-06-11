const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
  },
  password: {
    type: String,
  },
  email: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user',
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  mustChangePassword: {
    type: Boolean,
    default: true, // bắt buộc đổi mật khẩu sau lần đăng nhập đầu
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema, 'users');