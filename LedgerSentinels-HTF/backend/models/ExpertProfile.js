const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  company: String,
  position: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String,
});

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  field: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String,
});

const certificationSchema = new mongoose.Schema({
  name: String,
  issuer: String,
  issueDate: Date,
  expiryDate: Date,
  credentialId: String,
  credentialUrl: String,
});

const documentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  url: String,
  uploadedAt: { type: Date, default: Date.now },
});

const availabilitySchema = new mongoose.Schema({
  monday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  tuesday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  wednesday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  thursday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  friday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  saturday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
  sunday: {
    available: { type: Boolean, default: false },
    startTime: String,
    endTime: String,
  },
});

const expertProfileSchema = new mongoose.Schema({
  // Basic information
  address: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profession: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  
  // Profile details
  profileImage: {
    type: String,
    default: null,
  },
  coverImage: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  
  // Professional information
  skills: [{
    type: String,
    trim: true,
  }],
  experience: [experienceSchema],
  education: [educationSchema],
  certifications: [certificationSchema],
  
  // Pricing and availability
  hourlyRate: {
    type: Number,
    default: 0,
    min: 0,
  },
  availability: availabilitySchema,
  
  // Languages
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'],
      default: 'Intermediate',
    },
  }],
  
  // Blockchain specific
  ens: {
    type: String,
  },
  
  // Statistics
  totalSlots: {
    type: Number,
    default: 0,
  },
  totalBookings: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  
  // Verification
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  
  // Documents
  documents: [documentSchema],
  
  // Social links
  socialLinks: {
    website: String,
    linkedin: String,
    twitter: String,
    github: String,
    portfolio: String,
  },
  
  // Location
  location: {
    country: String,
    city: String,
    timezone: String,
  },
  
  // Preferences
  preferences: {
    responseTime: {
      type: String,
      enum: ['immediate', 'within_hour', 'within_day'],
      default: 'within_day',
    },
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'video_call'],
      default: 'email',
    },
  },
  
  // Analytics
  profileViews: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  
  // Featured status
  isFeatured: {
    type: Boolean,
    default: false,
  },
  featuredUntil: Date,
}, {
  timestamps: true,
});

// Indexes for better performance
expertProfileSchema.index({ profession: 1 });
expertProfileSchema.index({ rating: -1 });
expertProfileSchema.index({ hourlyRate: 1 });
expertProfileSchema.index({ isActive: 1, isVerified: 1 });
expertProfileSchema.index({ 'skills': 1 });
expertProfileSchema.index({ 'location.country': 1, 'location.city': 1 });

// Virtual for average rating
expertProfileSchema.virtual('averageRating').get(function() {
  return this.reviewCount > 0 ? (this.rating / this.reviewCount).toFixed(2) : 0;
});

// Method to update rating
expertProfileSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating * this.reviewCount) + newRating;
  this.reviewCount += 1;
  this.rating = totalRating / this.reviewCount;
  return this.save();
};

// Method to get public profile
expertProfileSchema.methods.getPublicProfile = function() {
  const profile = this.toObject();
  // Remove sensitive information
  delete profile.documents;
  return profile;
};

// Ensure virtual fields are serialized
expertProfileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ExpertProfile', expertProfileSchema);
