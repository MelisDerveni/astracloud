import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User, { IUser } from './models/User'; // Import the User model
import { getAIResponse } from './services/aiService';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for JWT secret

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error('MONGO_URI is not defined in the .env file.');
  process.exit(1); // Exit the process if URI is missing
}

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err: any) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process on connection failure
  });

// --- Protected Route Middleware ---
interface AuthRequest extends Request {
  user?: { id: string };
}

const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;
  // Check if token is in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Get token from "Bearer TOKEN"
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    req.user = decoded; // Attach user ID to request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// --- Routes ---

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, age, school, grade } = req.body;

  // Basic validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user instance with all fields
    user = new User({
      email,
      password,
      firstName,
      lastName,
      age: age ? parseInt(age) : undefined,
      school,
      grade
    });

    // Save user to database (password hashing happens in pre-save hook)
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Respond with token and user data
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        school: user.school,
        grade: user.grade
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    // Handle Mongoose validation errors or duplicate key errors more specifically
    if (error.code === 11000) { // Duplicate key error (for unique email)
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Find user by email, explicitly select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Respond with token and user data
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        school: user.school,
        grade: user.grade,
        interests: user.interests,
        achievements: user.achievements,
        academicProgress: user.academicProgress,
        universityApplications: user.universityApplications,
        applicationProgress: user.applicationProgress
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
app.get('/api/user/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      school: user.school,
      grade: user.grade,
      interests: user.interests,
      achievements: user.achievements,
      academicProgress: user.academicProgress,
      universityApplications: user.universityApplications,
      applicationProgress: user.applicationProgress
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching profile', error: error.message });
  }
});

// Example protected route
app.get('/api/protected', protect, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: `Welcome to the protected route, user ${req.user?.id}!`,
    userId: req.user?.id
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user and invalidate token
// @access  Private
app.post('/api/auth/logout', protect, async (req: AuthRequest, res: Response) => {
  try {
    // In a real application, you might want to add the token to a blacklist
    // or implement token revocation. For now, we'll just send a success response
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
});

// @route   POST /api/ai/chat
// @desc    Get AI response for career and education questions
// @access  Private
app.post('/api/ai/chat', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      console.log('Missing message in request body');
      return res.status(400).json({ 
        message: 'Message is required',
        error: 'MISSING_MESSAGE'
      });
    }

    if (typeof message !== 'string') {
      console.log('Invalid message format:', message);
      return res.status(400).json({ 
        message: 'Message must be a string',
        error: 'INVALID_MESSAGE_FORMAT'
      });
    }

    console.log('Processing chat request:', { 
      userId: req.user?.id,
      messageLength: message.length 
    });

    const response = await getAIResponse(message);
    
    console.log('Successfully generated AI response');
    res.status(200).json({ response });
  } catch (error: any) {
    console.error('AI Chat error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('Invalid API key')) {
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('Rate limit')) {
      statusCode = 429; // Too Many Requests
    } else if (error.message.includes('Unable to connect')) {
      statusCode = 503; // Service Unavailable
    }
    
    res.status(statusCode).json({ 
      message: error.message || 'Failed to get AI response',
      error: error.message || 'UNKNOWN_ERROR'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access protected route at http://localhost:${PORT}/api/protected`);
});