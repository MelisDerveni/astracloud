import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await onLogout();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/user/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: chatMessage, 
          sender: 'user' 
        })
      });

      if (response.ok) {
        setChatMessage('');
        setMessage('Message sent!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Helper function to get user initials
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  // Helper function to calculate average grade
  const calculateAverageGrade = () => {
    if (!user?.academicProgress || user.academicProgress.length === 0) return 'N/A';
    
    const gradePoints = {
      'A+': 4.3, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D+': 1.3, 'D': 1.0, 'F': 0
    };

    const totalPoints = user.academicProgress.reduce((sum, course) => {
      return sum + (gradePoints[course.grade] || 0);
    }, 0);

    const average = totalPoints / user.academicProgress.length;
    
    // Convert back to letter grade
    if (average >= 4.0) return 'A';
    if (average >= 3.7) return 'A-';
    if (average >= 3.3) return 'B+';
    if (average >= 3.0) return 'B';
    if (average >= 2.7) return 'B-';
    if (average >= 2.3) return 'C+';
    if (average >= 2.0) return 'C';
    return 'C-';
  };

  // Helper function to get interest colors
  const getInterestColor = (category) => {
    const colors = {
      'Gaming': 'orange',
      'AI Software Testing': 'purple',
      'Robotics': 'orange',
      'Other': 'blue'
    };
    return colors[category] || 'gray';
  };

  // Helper function to format deadline
  const formatDeadline = (date) => {
    const deadline = new Date(date);
    const options = { month: 'short', day: 'numeric' };
    return deadline.toLocaleDateString('en-US', options);
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'text-gray-600',
      'In Progress': 'text-yellow-600',
      'Submitted': 'text-green-600',
      'Accepted': 'text-green-700 font-bold',
      'Rejected': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header with Logout */}
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-300 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{getInitials()}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {user.firstName} {user.lastName}
                  </h2>
                  {user.age && <p className="text-gray-600">{user.age} years old</p>}
                  {user.school && <p className="text-gray-600">{user.school}</p>}
                  {user.grade && <p className="text-gray-600">{user.grade}</p>}
                </div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
                Edit Profile
              </button>
            </div>

            <div className="space-y-4">
              {/* Interests & Hobbies */}
              {user.interests && user.interests.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Interests & Hobbies</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {user.interests.map((interest, index) => (
                      <li key={index}>{interest.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Achievements */}
              {user.achievements && user.achievements.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Achievements</h3>
                  {user.achievements.map((achievement, index) => (
                    <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-2">
                      <p className="text-yellow-700">
                        {achievement.icon || '🏆'} {achievement.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Grades Section */}
          {user.academicProgress && user.academicProgress.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Academic Progress</h3>
              <div className="space-y-3">
                {user.academicProgress.map((course, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{course.subject}</span>
                    <span className="font-semibold text-gray-800">{course.grade}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Chat with Assistant</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <input 
                type="text" 
                placeholder="Type a message..."
                className="w-full p-2 bg-transparent border-0 focus:outline-none placeholder-gray-500"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Send Message
              </button>
              {message && (
                <p className="mt-2 text-sm text-green-600">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Enhanced Profile Stats */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Age</p>
                <p className="text-xl font-bold">{user.age || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Achievements</p>
                <p className="text-xl font-bold">{user.achievements?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Grade</p>
                <p className="text-xl font-bold">{calculateAverageGrade()}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-800">
                  {user.applicationProgress?.averageCompletion || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-400 rounded-full h-2 transition-all duration-300" 
                  style={{ width: `${user.applicationProgress?.averageCompletion || 0}%` }}
                ></div>
              </div>
            </div>

            {user.interests && user.interests.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {user.interests.slice(0, 4).map((interest, index) => (
                  <div key={index} className="text-blue-600">{interest.name}</div>
                ))}
              </div>
            )}
          </div>

          {/* Interests Chart Visualization */}
          {user.interests && user.interests.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Interests & Hobbies</h3>
              <div className="space-y-3">
                {user.interests.map((interest, index) => {
                  const color = getInterestColor(interest.category);
                  const heights = [8, 12, 16, 10, 14, 18];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{interest.name}</span>
                      <div className="flex space-x-1">
                        {[...Array(Math.min(3, index + 1))].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-8 bg-${color}-${400 + i * 100} rounded`}
                            style={{ height: `${heights[i * 2]}px` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Assistant CTA */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl shadow-md text-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Ask AI</h3>
                <p className="text-purple-100">Help with your studies</p>
              </div>
            </div>
          </div>

          {/* Application Button */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 rounded-xl shadow-md text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Begin application</span>
              <span className="text-xl">→</span>
            </div>
          </div>

          {/* University Applications */}
          {user.universityApplications && user.universityApplications.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">University Applications</h3>
              <div className="space-y-4">
                {user.universityApplications.map((app, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{app.universityName}</h4>
                      <span className="text-sm text-red-600">
                        Deadline: {formatDeadline(app.deadline)}
                      </span>
                    </div>
                    <p className="text-gray-600">{app.program}</p>
                    <p className={`text-sm mt-1 ${getStatusColor(app.status)}`}>
                      Status: {app.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Application Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Average Completion</span>
                  <span className="font-semibold text-gray-800">
                    {user.applicationProgress?.averageCompletion || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 rounded-full h-2 transition-all duration-300" 
                    style={{ width: `${user.applicationProgress?.averageCompletion || 0}%` }}
                  ></div>
                </div>
              </div>
              
              {user.applicationProgress?.currentProject && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-700">
                    📝 {user.applicationProgress.currentProject}
                    {user.applicationProgress.projectLink && 
                      ` - ${user.applicationProgress.projectLink}`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;