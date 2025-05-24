import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import confusedImage from './assets/confused.png'; // Import the image

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check for existing auth on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (err) {
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
  }, []);

  const handleLoginSuccess = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleSignupSuccess = (token, userData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Clear old token and userEmail if they exist
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUser(null);
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 fixed w-full z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">CareerCompass</Link>
          <div className="hidden md:flex space-x-8">
            <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">About Us</Link>
            <Link to="/students" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Our Students</Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">Contact Us</Link>
          </div>
          <div className="flex space-x-4 items-center">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200">Log in</Link>
                <Link to="/signup" className="px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105">Sign up</Link>
              </>
            ) : (
              <>
                <span className="text-gray-600">
                  Welcome, {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <Link to="/dashboard" className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all duration-200">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 transition-all duration-200"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Text content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              Find Your Path to Success
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto md:mx-0 mb-10 leading-relaxed">
              Get personalized guidance on choosing your career path and navigating the university application process.
            </p>
            {!isLoggedIn ? (
              <div className="space-x-4">
                <Link to="/signup" className="inline-block px-8 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  Get Started
                </Link>
              </div>
            ) : (
              <Link to="/dashboard" className="inline-block px-8 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Go to Dashboard
              </Link>
            )}
          </div>
          {/* Image */}
          <div className="w-full md:w-1/2 hidden md:flex justify-center items-center">
            <img src={confusedImage} alt="Career Advice Illustration" className="max-w-md transform hover:scale-105 transition-transform duration-300" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">About Us</h3>
            <p className="text-gray-600 leading-relaxed">
              Learn about our mission to support students in their career and university choices.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Students</h3>
            <p className="text-gray-600 leading-relaxed">
              Read testimonials from students we've helped find their ideal career paths.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">University Reviews</h3>
            <p className="text-gray-600 leading-relaxed">
              Discover reviews and insights on a range of universities to help you decide.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 transform hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Get in Touch</h3>
            <p className="text-gray-600 leading-relaxed">
              Reach out for personalized advice and answers to your questions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          &copy; {new Date().getFullYear()} CareerCompass. All rights reserved.
        </div>
      </footer>
    </div>
  );

  // Protected Route Component
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={
            isLoggedIn ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isLoggedIn ? 
              <Navigate to="/dashboard" replace /> : 
              <Signup onSignupSuccess={handleSignupSuccess} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/about" element={<div className="pt-20 container mx-auto">About Us Page</div>} />
        <Route path="/students" element={<div className="pt-20 container mx-auto">Our Students Page</div>} />
        <Route path="/contact" element={<div className="pt-20 container mx-auto">Contact Us Page</div>} />
      </Routes>
    </Router>
  );
}

export default App;