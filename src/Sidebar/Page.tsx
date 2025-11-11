
import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaList, FaCog } from 'react-icons/fa';
import './Page.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h3>Menu</h3>
      <ul>
        <li>
          <Link to="/">
            <FaHome className="icon" />
            <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to="/todolist">
            <FaList className="icon" />
            <span>ToDo List</span>
          </Link>
        </li>
        <li>
          <Link to="/settings">
            <FaCog className="icon" />
            <span>Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
