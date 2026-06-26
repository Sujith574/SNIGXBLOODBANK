import { Route, Routes as RouterRoutes } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';

export default function Routes() {
  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Login />} />
      <Route path="*" element={<Login />} />
    </RouterRoutes>
  );
}



