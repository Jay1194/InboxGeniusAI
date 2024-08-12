import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import client from './apolloClient';
import Login from './components/login';
import Dashboard from './components/Dashboard';
import HandleAuth from './components/Handle';
import CategoryPage from './components/CategoryPage';

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/handle-auth" element={<HandleAuth />} />
            <Route path="/category/:category" element={<CategoryPage />} />
          </Routes>
        </div>
      </Router>
    </ApolloProvider>
  );
}

export default App;