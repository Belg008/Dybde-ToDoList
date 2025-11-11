
import React, { useState } from 'react';
import './Page.css';

const Settings = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
  });

  const handleNotificationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications({
      ...notifications,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <div className={`settings-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <h1>Settings</h1>
      <div className="setting-item">
        <h2>Appearance</h2>
        <div className="setting-option">
          <label htmlFor="darkModeToggle">Dark Mode</label>
          <label className="switch">
            <input
              type="checkbox"
              id="darkModeToggle"
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>
      <div className="setting-item">
        <h2>Language</h2>
        <div className="setting-option">
          <label htmlFor="languageSelect">Select Language</label>
          <select
            id="languageSelect"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
      </div>
      <div className="setting-item">
        <h2>Notifications</h2>
        <div className="setting-option">
          <label>
            <input
              type="checkbox"
              name="email"
              checked={notifications.email}
              onChange={handleNotificationChange}
            />
            Email Notifications
          </label>
        </div>
        <div className="setting-option">
          <label>
            <input
              type="checkbox"
              name="push"
              checked={notifications.push}
              onChange={handleNotificationChange}
            />
            Push Notifications
          </label>
        </div>
      </div>
    </div>
  );
};

export default Settings;
