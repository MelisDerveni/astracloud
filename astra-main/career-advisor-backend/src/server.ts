import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import User, { IUser } from './models/User'; // Import the User model

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

// --- Routes ---

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user instance
    user = new User({ email, password });

    // Save user to database (password hashing happens in pre-save hook)
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    // Respond with token and user ID
    res.status(201).json({
      message: 'User registered successfully',
      token,
      userId: user._id,
      email: user.email // Include email for confirmation
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

    // Respond with token and user ID
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      userId: user._id,
      email: user.email
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// --- Protected Route Example (for demonstration) ---
// This middleware protects routes that require authentication
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

// Example protected route
app.get('/api/protected', protect, (req: AuthRequest, res: Response) => {
  res.status(200).json({
    message: `Welcome to the protected route, user ${req.user?.id}!`,
    userId: req.user?.id
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access protected route at http://localhost:${PORT}/api/protected`);
});