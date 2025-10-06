const ExpertProfile = require('../models/ExpertProfile');
const User = require('../models/User');
const { getFileUrl } = require('../middleware/upload');

// Create expert profile
const createExpertProfile = async (req, res) => {
  try {
    const {
      profession,
      description,
      skills,
      experience,
      education,
      certifications,
      hourlyRate,
      availability,
      languages
    } = req.body;

    // Check if user already has an expert profile
    const existingProfile = await ExpertProfile.findOne({ address: req.user.address });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Expert profile already exists'
      });
    }

    // Create expert profile
    const expertProfile = new ExpertProfile({
      address: req.user.address,
      name: req.user.name,
      profession,
      description,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      certifications: certifications || [],
      hourlyRate: hourlyRate || 0,
      availability: availability || {},
      languages: languages || [],
      profileImage: req.user.profileImage,
      isActive: true
    });

    await expertProfile.save();

    // Update user to be expert
    await User.findByIdAndUpdate(req.userId, {
      isExpert: true,
      userType: 'expert',
      expertProfile: expertProfile._id
    });

    res.status(201).json({
      success: true,
      message: 'Expert profile created successfully',
      data: {
        expertProfile
      }
    });
  } catch (error) {
    console.error('Create expert profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expert profile',
      error: error.message
    });
  }
};

// Get expert profile
const getExpertProfile = async (req, res) => {
  try {
    const expertProfile = await ExpertProfile.findOne({ address: req.user.address });
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        expertProfile
      }
    });
  } catch (error) {
    console.error('Get expert profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert profile',
      error: error.message
    });
  }
};

// Update expert profile
const updateExpertProfile = async (req, res) => {
  try {
    const {
      profession,
      description,
      skills,
      experience,
      education,
      certifications,
      hourlyRate,
      availability,
      languages
    } = req.body;

    const expertProfile = await ExpertProfile.findOne({ address: req.user.address });
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // Update fields
    if (profession) expertProfile.profession = profession;
    if (description) expertProfile.description = description;
    if (skills) expertProfile.skills = skills;
    if (experience) expertProfile.experience = experience;
    if (education) expertProfile.education = education;
    if (certifications) expertProfile.certifications = certifications;
    if (hourlyRate !== undefined) expertProfile.hourlyRate = hourlyRate;
    if (availability) expertProfile.availability = availability;
    if (languages) expertProfile.languages = languages;

    await expertProfile.save();

    res.json({
      success: true,
      message: 'Expert profile updated successfully',
      data: {
        expertProfile
      }
    });
  } catch (error) {
    console.error('Update expert profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expert profile',
      error: error.message
    });
  }
};

// Get all experts
const getAllExperts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      profession,
      minRating,
      maxRate,
      search,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { isActive: true };
    
    if (profession) {
      filter.profession = { $regex: profession, $options: 'i' };
    }
    
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    
    if (maxRate) {
      filter.hourlyRate = { $lte: parseFloat(maxRate) };
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { profession: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const experts = await ExpertProfile.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email profileImage isVerified');

    const total = await ExpertProfile.countDocuments(filter);

    res.json({
      success: true,
      data: {
        experts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get all experts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get experts',
      error: error.message
    });
  }
};

// Get expert by ID
const getExpertById = async (req, res) => {
  try {
    const { expertId } = req.params;
    
    const expertProfile = await ExpertProfile.findById(expertId)
      .populate('user', 'name email profileImage isVerified');
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert not found'
      });
    }

    res.json({
      success: true,
      data: {
        expertProfile
      }
    });
  } catch (error) {
    console.error('Get expert by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert',
      error: error.message
    });
  }
};

// Upload expert documents
const uploadDocuments = async (req, res) => {
  try {
    const expertProfile = await ExpertProfile.findOne({ address: req.user.address });
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process uploaded files
    const documents = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: getFileUrl(req, file.path),
      uploadedAt: new Date()
    }));

    // Add documents to expert profile
    expertProfile.documents = [...(expertProfile.documents || []), ...documents];
    await expertProfile.save();

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents
      }
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// Update expert availability
const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    const expertProfile = await ExpertProfile.findOne({ address: req.user.address });
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    expertProfile.availability = availability;
    await expertProfile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: expertProfile.availability
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
};

// Get expert statistics
const getExpertStats = async (req, res) => {
  try {
    const expertProfile = await ExpertProfile.findOne({ address: req.user.address });
    
    if (!expertProfile) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // Get additional stats from other collections
    const stats = {
      totalSlots: expertProfile.totalSlots,
      totalBookings: expertProfile.totalBookings,
      rating: expertProfile.rating,
      reviewCount: expertProfile.reviewCount,
      hourlyRate: expertProfile.hourlyRate,
      // Add more stats as needed
    };

    res.json({
      success: true,
      data: {
        stats
      }
    });
  } catch (error) {
    console.error('Get expert stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert statistics',
      error: error.message
    });
  }
};

module.exports = {
  createExpertProfile,
  getExpertProfile,
  updateExpertProfile,
  getAllExperts,
  getExpertById,
  uploadDocuments,
  updateAvailability,
  getExpertStats
};
