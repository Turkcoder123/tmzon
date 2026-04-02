const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true },
    deviceName: { type: String, default: 'Unknown Device' },
    deviceType: { type: String, enum: ['mobile', 'web', 'desktop', 'unknown'], default: 'unknown' },
    refreshTokenHash: { type: String, required: true },
    tokenFamily: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isPrivate: { type: Boolean, default: false },
    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Email verification
    emailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },

    // Phone
    phone: { type: String, sparse: true },
    phoneVerified: { type: Boolean, default: false },

    // Google OAuth
    googleId: { type: String, sparse: true },

    // Account linking – tracks which providers are linked
    providers: [{ type: String, enum: ['local', 'google', 'phone'] }],

    // Magic link
    magicLinkToken: { type: String },
    magicLinkExpires: { type: Date },

    // Password reset
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Login lockout (flexible)
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // Device sessions (max 3)
    sessions: [sessionSchema],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
  }
  await this.save();
};

// Reset login attempts on successful login
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
  }
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationCode;
    delete ret.emailVerificationExpires;
    delete ret.magicLinkToken;
    delete ret.magicLinkExpires;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.blockedBy;
    // Strip refresh token hashes from sessions
    if (ret.sessions) {
      ret.sessions = ret.sessions.map((s) => ({
        _id: s._id,
        deviceId: s.deviceId,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
      }));
    }
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
