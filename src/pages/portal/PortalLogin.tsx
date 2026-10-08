import React from 'react';
import { Navigate } from 'react-router-dom';

export function PortalLogin() {
  return <Navigate to="/login" replace />;
}
