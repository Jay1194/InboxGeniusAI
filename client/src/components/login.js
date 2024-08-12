import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import '../login.css';
import loginArt from '../components/login-art.png'

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
      }
    }
  }
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      navigate('/dashboard');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ variables: { email, password } });
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign-In clicked');
    window.location.href = 'http://localhost:4000/api/auth';
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="my-logo"></div>
          <h2>Login To Your Gmail</h2>
          <div className="or-divider"></div>
          <button type="button" className="google-button" onClick={handleGoogleSignIn}>
            <div className="google-icon"></div>
            Sign in with Google
          </button>
        </form>
        <p className="ai">powered by AI⚡️</p>
      </div>
      <div className="login-right" style={{backgroundImage: `url(${loginArt})`}}></div>
    </div>
  );
}

export default Login;