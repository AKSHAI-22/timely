const { ethers } = require('ethers');
const contractService = require('../services/contractService');
const User = require('../models/User');
const ExpertProfile = require('../models/ExpertProfile');

// Create a new time slot
const createTimeSlot = async (req, res) => {
  try {
    const { startTime, endTime, price, description } = req.body;
    const expertAddress = req.user.address;

    // Validate input
    if (!startTime || !endTime || !price) {
      return res.status(400).json({
        success: false,
        message: 'Start time, end time, and price are required'
      });
    }

    // Check if user is an expert
    const expertProfile = await ExpertProfile.findOne({ address: expertAddress });
    if (!expertProfile || !expertProfile.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User is not an active expert'
      });
    }

    // Convert times to Unix timestamps
    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    // Validate time range
    if (startTimestamp >= endTimestamp) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Convert price to wei
    const priceInWei = ethers.parseEther(price.toString());

    // Get contract instance
    const contract = contractService.getTimeSlotNFT();
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Smart contract not available'
      });
    }

    // First, ensure the expert is registered in the smart contract
    try {
      await contractService.createExpertProfile(
        expertProfile.name,
        expertProfile.profession,
        expertProfile.description,
        '', // ENS (empty for now)
        expertAddress
      );
    } catch (error) {
      // If expert profile already exists, continue
      if (!error.message.includes('already exists')) {
        console.log('Warning: Could not create expert profile in contract:', error.message);
      }
    }

    // Create time slot on blockchain
    const tx = await contract.createTimeSlot(
      startTimestamp,
      endTimestamp,
      priceInWei,
      expertProfile.profession,
      description || '',
      { gasLimit: 500000 }
    );

    const receipt = await tx.wait();
    
    // Get the token ID from the event
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'SlotCreated';
      } catch (e) {
        return false;
      }
    });

    if (!event) {
      throw new Error('SlotCreated event not found');
    }

    const parsedEvent = contract.interface.parseLog(event);
    const tokenId = parsedEvent.args.tokenId.toString();

    res.json({
      success: true,
      message: 'Time slot created successfully',
      data: {
        tokenId,
        txHash: tx.hash,
        startTime: startTimestamp,
        endTime: endTimestamp,
        price: priceInWei.toString(),
        description: description || ''
      }
    });

  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create time slot',
      error: error.message
    });
  }
};

// List time slots for an expert
const getExpertTimeSlots = async (req, res) => {
  try {
    const expertAddress = req.user.address;

    // Check if user is an expert
    const expertProfile = await ExpertProfile.findOne({ address: expertAddress });
    if (!expertProfile) {
      return res.status(403).json({
        success: false,
        message: 'User is not an expert'
      });
    }

    // Get contract instance
    const contract = contractService.getTimeSlotNFT();
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Smart contract not available'
      });
    }

    // Get time slots created by this expert
    const filter = contract.filters.SlotCreated(null, expertAddress);
    const events = await contract.queryFilter(filter);

    const timeSlots = await Promise.all(events.map(async (event) => {
      const { tokenId, expert, startTime, endTime, price, profession } = event.args;
      
      // Check if slot is still available
      const timeSlot = await contract.getTimeSlot(tokenId);
      const isAvailable = !timeSlot.isBooked && !timeSlot.isRevoked;
      const owner = await contract.ownerOf(tokenId);

      return {
        tokenId: tokenId.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        price: ethers.formatEther(price),
        profession,
        isAvailable,
        owner,
        expertAddress: expert
      };
    }));

    res.json({
      success: true,
      data: timeSlots
    });

  } catch (error) {
    console.error('Error fetching expert time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time slots',
      error: error.message
    });
  }
};

// List all available time slots (marketplace)
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { profession, minPrice, maxPrice, search } = req.query;

    // Get contract instance
    const contract = contractService.getTimeSlotNFT();
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Smart contract not available'
      });
    }

    // Get all time slot creation events
    const filter = contract.filters.SlotCreated();
    const events = await contract.queryFilter(filter);

    let timeSlots = await Promise.all(events.map(async (event) => {
      const { tokenId, expert, startTime, endTime, price, profession } = event.args;
      
      // Check if slot is still available
      const timeSlot = await contract.getTimeSlot(tokenId);
      const isAvailable = !timeSlot.isBooked && !timeSlot.isRevoked;
      const owner = await contract.ownerOf(tokenId);

      // Get expert profile for additional info
      const expertProfile = await ExpertProfile.findOne({ address: expert });

      return {
        tokenId: tokenId.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        price: ethers.formatEther(price),
        profession,
        isAvailable,
        owner,
        expertAddress: expert,
        expertProfile: expertProfile ? {
          name: expertProfile.name,
          profession: expertProfile.profession,
          rating: expertProfile.rating,
          profileImage: expertProfile.profileImage
        } : null
      };
    }));

    // Filter by availability
    timeSlots = timeSlots.filter(slot => slot.isAvailable);

    // Apply filters
    if (profession) {
      timeSlots = timeSlots.filter(slot => 
        slot.expertProfile && 
        slot.expertProfile.profession.toLowerCase().includes(profession.toLowerCase())
      );
    }

    if (minPrice) {
      timeSlots = timeSlots.filter(slot => 
        parseFloat(slot.price) >= parseFloat(minPrice)
      );
    }

    if (maxPrice) {
      timeSlots = timeSlots.filter(slot => 
        parseFloat(slot.price) <= parseFloat(maxPrice)
      );
    }

    if (search) {
      timeSlots = timeSlots.filter(slot => 
        slot.description.toLowerCase().includes(search.toLowerCase()) ||
        (slot.expertProfile && slot.expertProfile.name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    res.json({
      success: true,
      data: timeSlots
    });

  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch time slots',
      error: error.message
    });
  }
};

// Buy a time slot
const buyTimeSlot = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const buyerAddress = req.user.address;

    // Get contract instances
    const timeSlotContract = contractService.getTimeSlotNFT();
    const marketplaceContract = contractService.getTimeSlotMarketplace();
    
    if (!timeSlotContract || !marketplaceContract) {
      return res.status(500).json({
        success: false,
        message: 'Smart contracts not available'
      });
    }

    // Check if time slot exists and is available
    const isAvailable = await timeSlotContract.isAvailable(tokenId);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not available'
      });
    }

    // Get time slot details
    const timeSlot = await timeSlotContract.getTimeSlot(tokenId);
    const price = timeSlot.price;

    // Buy the time slot
    const tx = await marketplaceContract.buyTimeSlot(tokenId, {
      value: price,
      gasLimit: 500000
    });

    const receipt = await tx.wait();

    res.json({
      success: true,
      message: 'Time slot purchased successfully',
      data: {
        tokenId,
        txHash: tx.hash,
        buyer: buyerAddress,
        price: ethers.formatEther(price)
      }
    });

  } catch (error) {
    console.error('Error buying time slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to buy time slot',
      error: error.message
    });
  }
};

// Get user's purchased time slots
const getUserTimeSlots = async (req, res) => {
  try {
    const userAddress = req.user.address;

    // Get contract instance
    const contract = contractService.getTimeSlotNFT();
    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Smart contract not available'
      });
    }

    // Get all time slot creation events
    const filter = contract.filters.SlotCreated();
    const events = await contract.queryFilter(filter);

    const userTimeSlots = await Promise.all(events.map(async (event) => {
      const { tokenId, expert, startTime, endTime, price, profession } = event.args;
      
      // Check if user owns this slot
      const owner = await contract.ownerOf(tokenId);
      if (owner.toLowerCase() !== userAddress.toLowerCase()) {
        return null;
      }

      // Get expert profile
      const expertProfile = await ExpertProfile.findOne({ address: expert });

      return {
        tokenId: tokenId.toString(),
        startTime: startTime.toString(),
        endTime: endTime.toString(),
        price: ethers.formatEther(price),
        profession,
        expertAddress: expert,
        expertProfile: expertProfile ? {
          name: expertProfile.name,
          profession: expertProfile.profession,
          rating: expertProfile.rating,
          profileImage: expertProfile.profileImage
        } : null
      };
    }));

    // Filter out null values
    const filteredSlots = userTimeSlots.filter(slot => slot !== null);

    res.json({
      success: true,
      data: filteredSlots
    });

  } catch (error) {
    console.error('Error fetching user time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user time slots',
      error: error.message
    });
  }
};

module.exports = {
  createTimeSlot,
  getExpertTimeSlots,
  getAvailableTimeSlots,
  buyTimeSlot,
  getUserTimeSlots
};
