const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false },
    displayName: { type: String, trim: true, maxlength: 50 },
    bio: { type: String, maxlength: 160, default: '' },
    avatar: { type: String, default: '' },
    authProvider: {
      type: String,
      enum: ['email', 'google', 'phone'],
      required: true,
    },
    googleId: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationExpires: { type: Date, select: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationCode;
  delete obj.verificationExpires;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
