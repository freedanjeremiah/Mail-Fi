"use client";

import React from 'react';
import { BlockscoutSimpleDashboard } from '../components/blockscout-simple-dashboard';

export default function BlockscoutDashboardPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f8f9fa',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <BlockscoutSimpleDashboard />
      </div>
    </div>
  );
}
