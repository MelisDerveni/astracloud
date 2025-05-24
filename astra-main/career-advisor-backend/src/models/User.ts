import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Define the interface for a User document
export interface IUser extends Document {
  // Basic auth fields
  email: string;
  password?: string;
  
  // Profile fields
  firstName: string;
  lastName: string;
  age?: number;
  school?: string;
  grade?: string;
  profilePicture?: string;
  
  // Academic & Achievements
  achievements: Array<{
    title: string;
    icon?: string;
    date?: Date;
  }>;
  
  academicProgress: Array<{
    subject: string;
    grade: string;
    progress?: number;
  }>;
  
  // Interests & Hobbies
  interests: Array<{
    name: string;
    category: string;
  }>;
  
  // University Applications
  universityApplications: Array<{
    universityName: string;
    program: string;
    deadline: Date;
    status: string;
  }>;
  
  applicationProgress: {
    averageCompletion: number;
    currentProject?: string;
    projectLink?: string;
  };
  
  // Chat History
  chatHistory?: Array<{
    message: string;
    sender: string;
    timestamp: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  fullName?: string;
  
  // Methods
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

// Define the User schema with proper typing
const UserSchema: Schema<IUser> = new Schema<IUser>({
  // Authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  
  // Profile fields
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  age: {
    type: Number,
    min: [13, 'Must be at least 13 years old'],
    max: [100, 'Invalid age']
  },
  school: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  
  // Academic & Achievements
  achievements: [{
    title: {
      type: String,
      required: true
    },
    icon: String,
    date: Date
  }],
  
  academicProgress: [{
    subject: {
      type: String,
      required: true
    },
    grade: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  
  // Interests & Hobbies
  interests: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Gaming', 'AI Software Testing', 'Robotics', 'Other'],
      required: true
    }
  }],
  
  // University Applications
  universityApplications: [{
    universityName: {
      type: String,
      required: true
    },
    program: {
      type: String,
      required: true
    },
    deadline: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Submitted', 'Accepted', 'Rejected'],
      default: 'Not Started'
    }
  }],
  
  applicationProgress: {
    averageCompletion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    currentProject: String,
    projectLink: String
  },
  
  // Chat History
  chatHistory: {
    type: [{
      message: {
        type: String,
        required: true
      },
      sender: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save hook to hash the password
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  return this.password ? await bcrypt.compare(candidatePassword, this.password) : false;
};

// Create and export the User model
const User = mongoose.model<IUser>('User', UserSchema);
export default User;