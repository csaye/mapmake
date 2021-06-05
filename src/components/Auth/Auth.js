import React, { useState } from 'react';

import { useCollectionData } from 'react-firebase-hooks/firestore';
import firebase from 'firebase/app';

import logo from '../../img/logo.png';
import './Auth.css';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [signingUp, setSigningUp] = useState(false);

  const usernamesRef = firebase.firestore().collection('usernames');
  const [usernamesData] = useCollectionData(usernamesRef);

  return (
    <div className="Auth">
      <div className="center-box">
        <img src={logo} alt="logo" />
        <h1>MapMake</h1>
        <hr />
        {error && <p className="error-text">{error}</p>}
        <hr />
        {
          signingUp ?
          <button onClick={() => {
            setError('');
            setSigningUp(false);
          }}>Have an account? Sign in</button> :
          <button onClick={() => {
            setError('');
            setSigningUp(true);
          }}>No account? Sign up</button>
        }
      </div>
    </div>
  );
}

export default Auth;
