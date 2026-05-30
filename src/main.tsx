import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "./styles.css";
import "./index.css";
import "./App.css";
import "./Users.css"
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "leaflet/dist/leaflet.css";

createRoot(document.getElementById('root')!).render(
  <App />
)
