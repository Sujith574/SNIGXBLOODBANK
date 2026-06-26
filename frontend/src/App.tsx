import { AuthProvider } from './context/AuthContext';
import Routes from './routes/Routes';

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}


