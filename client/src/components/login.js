import React, { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import '../login.css'; 
import loginArt from './login-art.png'; // Import your image

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
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION, {
    onCompleted: (data) => {
      localStorage.setItem('token', data.login.token);
      localStorage.setItem('user', JSON.stringify(data.login.user));
      // Redirect to dashboard or home page after successful login
      // You might want to use React Router's useNavigate hook for this
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ variables: { email, password } });
  };

  const handleGoogleSignIn = () => {
    // Implement Google Sign-In logic here
    console.log('Google Sign-In clicked');
    // You would typically redirect to your backend's Google OAuth endpoint here
    window.location.href = 'http://localhost:4000/api/auth';
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="my-logo"></div>
          <h2>Login To Your Email</h2>
          <button type="button" className="google-button" onClick={handleGoogleSignIn}>
            <div className="google-icon"></div>
            Sign in with Google
          </button>
          <div className="or-divider">or</div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Log In</button>
        </form>
      </div>
      <div className="login-right">
        <img src={loginArt} alt="Login Art" className="login-art" />
      </div>
    </div>
  );
}

export default Login;