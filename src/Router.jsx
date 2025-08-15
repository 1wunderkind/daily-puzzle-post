import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import App from './App';
import AdminDashboard from './AdminDashboard';
import AnalyticsViewer from './AnalyticsViewer';
import JSONDataEndpoint from './JSONDataEndpoint';

// Layout wrapper component for consistent styling
const Layout = ({ children, title, description }) => (
  <>
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="app-layout">
      {children}
    </div>
  </>
);

// Main Router Component
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Main Game Route */}
        <Route 
          path="/" 
          element={
            <Layout 
              title="Daily Puzzle Post - Classic Word Games"
              description="Play classic word games including Hangman with over 150 words across 4 categories. Enjoy newspaper-style puzzles with premium features and daily challenges."
            >
              <App />
            </Layout>
          } 
        />
        
        {/* Admin Dashboard Route */}
        <Route 
          path="/admin" 
          element={
            <Layout 
              title="Admin Dashboard - Daily Puzzle Post"
              description="Administrative dashboard for Daily Puzzle Post analytics, user management, and performance monitoring."
            >
              <AdminDashboard />
            </Layout>
          } 
        />
        
        {/* Analytics Viewer Route */}
        <Route 
          path="/analytics" 
          element={
            <Layout 
              title="Analytics Viewer - Daily Puzzle Post"
              description="Real-time analytics and performance metrics for Daily Puzzle Post word games platform."
            >
              <AnalyticsViewer />
            </Layout>
          } 
        />
        
        {/* JSON API Data Endpoint Route */}
        <Route 
          path="/api/data" 
          element={
            <Layout 
              title="API Data - Daily Puzzle Post"
              description="JSON API endpoint providing raw analytics data for Daily Puzzle Post platform."
            >
              <JSONDataEndpoint />
            </Layout>
          } 
        />
        
        {/* Catch-all route for 404s */}
        <Route 
          path="*" 
          element={
            <Layout 
              title="Page Not Found - Daily Puzzle Post"
              description="The requested page could not be found on Daily Puzzle Post."
            >
              <div className="not-found-page">
                <div className="newspaper-container">
                  <header className="newspaper-header">
                    <h1 className="masthead">DAILY PUZZLE POST</h1>
                    <div className="date-line">Page Not Found - Error 404</div>
                  </header>
                  
                  <div className="error-content">
                    <h2>Page Not Found</h2>
                    <p>The page you're looking for doesn't exist.</p>
                    
                    <div className="navigation-links">
                      <h3>Available Pages:</h3>
                      <ul>
                        <li><a href="/">🎮 Main Game</a></li>
                        <li><a href="/admin">📊 Admin Dashboard</a></li>
                        <li><a href="/analytics">📈 Analytics Viewer</a></li>
                        <li><a href="/api/data">🔗 JSON API Data</a></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Layout>
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;

