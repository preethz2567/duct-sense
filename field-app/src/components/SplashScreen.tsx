import React, { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation slightly after mount for smooth transition
    setTimeout(() => setAnimate(true), 100);
  }, []);

  return (
    <div className="splash-screen">
      <div className={`splash-content ${animate ? 'animate-in' : ''}`}>
        <img 
          src="/pwa-512x512.png" 
          alt="DuctSense Field Logo" 
          className="splash-logo" 
        />
        <h1 className="splash-title">DUCTSENSE</h1>
        <p className="splash-subtitle">FIELD APPLICATION</p>
        
        <div className="splash-loader">
          <div className="spinner"></div>
          <span>INITIALIZING OFFLINE STORAGE...</span>
        </div>
      </div>
    </div>
  );
}
