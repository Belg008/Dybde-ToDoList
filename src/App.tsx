
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SmartTodoApp from './SmartTodoApp/Page';
import Sidebar from "./Sidebar/Page";
import Home from './Home/Page';
import Settings from './Settings/Page';
import './App.css';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flexGrow: 1, padding: '20px', marginLeft: '10rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/todolist" element={<SmartTodoApp />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
