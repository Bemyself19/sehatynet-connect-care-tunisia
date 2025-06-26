import React from 'react';
import { Outlet } from 'react-router-dom';

const PatientLayout = () => (
  <div className="min-h-screen">
    <Outlet />
  </div>
);

export default PatientLayout; 