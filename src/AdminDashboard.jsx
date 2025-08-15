import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalPremiumUsers: 0,
    averageSessionTime: 0,
    topCategories: [],
    recentEvents: [],
    conversionRate: 0,
    dailyActiveUsers: 0
  });

  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = () => {
    setIsLoading(true);
    
    // Simulate loading analytics data
    // In production, this would fetch from your backend API
    setTimeout(() => {
      const mockData = generateMockAnalytics();
      setAnalyticsData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const generateMockAnalytics = () => {
    // Generate realistic mock data based on timeRange
    const multiplier = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : 30;
    
    return {
      totalUsers: Math.floor(Math.random() * 1000 * multiplier) + 500,
      totalGames: Math.floor(Math.random() * 5000 * multiplier) + 2000,
      totalPremiumUsers: Math.floor(Math.random() * 50 * multiplier) + 25,
      averageSessionTime: Math.floor(Math.random() * 300) + 180, // seconds
      dailyActiveUsers: Math.floor(Math.random() * 200) + 100,
      conversionRate: (Math.random() * 5 + 2).toFixed(2), // 2-7%
      topCategories: [
        { name: 'Animals', games: Math.floor(Math.random() * 1000) + 500, percentage: 35 },
        { name: 'Food', games: Math.floor(Math.random() * 800) + 400, percentage: 28 },
        { name: 'Places', games: Math.floor(Math.random() * 600) + 300, percentage: 22 },
        { name: 'Objects', games: Math.floor(Math.random() * 400) + 200, percentage: 15 }
      ],
      recentEvents: generateRecentEvents()
    };
  };

  const generateRecentEvents = () => {
    const events = [
      'User completed game in Animals category',
      'Premium upgrade successful',
      'New user registered',
      'Game completed with perfect score',
      'Hint used in Food category',
      'User shared game result',
      'Email captured for newsletter',
      'A/B test conversion recorded',
      'Badge earned: 25 Words Solved',
      'Daily challenge completed'
    ];

    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      event: events[Math.floor(Math.random() * events.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
      user: `User_${Math.floor(Math.random() * 1000)}`
    }));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Daily Puzzle Post - Admin Dashboard</h1>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Users</h3>
            <p className="metric-value">{formatNumber(analyticsData.totalUsers)}</p>
            <span className="metric-change positive">+12% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎮</div>
          <div className="metric-content">
            <h3>Games Played</h3>
            <p className="metric-value">{formatNumber(analyticsData.totalGames)}</p>
            <span className="metric-change positive">+8% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Premium Users</h3>
            <p className="metric-value">{formatNumber(analyticsData.totalPremiumUsers)}</p>
            <span className="metric-change positive">+15% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>Avg Session Time</h3>
            <p className="metric-value">{formatTime(analyticsData.averageSessionTime)}</p>
            <span className="metric-change positive">+5% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Daily Active Users</h3>
            <p className="metric-value">{formatNumber(analyticsData.dailyActiveUsers)}</p>
            <span className="metric-change positive">+18% vs previous period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Conversion Rate</h3>
            <p className="metric-value">{analyticsData.conversionRate}%</p>
            <span className="metric-change positive">+2.1% vs previous period</span>
          </div>
        </div>
      </section>

      {/* Category Performance */}
      <section className="category-performance">
        <h2>Category Performance</h2>
        <div className="category-chart">
          {analyticsData.topCategories.map((category, index) => (
            <div key={index} className="category-bar">
              <div className="category-info">
                <span className="category-name">{category.name}</span>
                <span className="category-games">{formatNumber(category.games)} games</span>
              </div>
              <div className="category-bar-container">
                <div 
                  className="category-bar-fill"
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <span className="category-percentage">{category.percentage}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {analyticsData.recentEvents.map((event) => (
            <div key={event.id} className="activity-item">
              <div className="activity-content">
                <p className="activity-event">{event.event}</p>
                <p className="activity-meta">
                  <span className="activity-user">{event.user}</span>
                  <span className="activity-time">{event.timestamp}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-button">
            <span className="action-icon">📊</span>
            <span>Export Analytics</span>
          </button>
          <button className="action-button">
            <span className="action-icon">👥</span>
            <span>Manage Users</span>
          </button>
          <button className="action-button">
            <span className="action-icon">🎮</span>
            <span>Game Settings</span>
          </button>
          <button className="action-button">
            <span className="action-icon">💰</span>
            <span>Premium Settings</span>
          </button>
          <button className="action-button">
            <span className="action-icon">📧</span>
            <span>Email Campaigns</span>
          </button>
          <button className="action-button">
            <span className="action-icon">🔧</span>
            <span>System Settings</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2024 Daily Puzzle Post Admin Dashboard</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;

