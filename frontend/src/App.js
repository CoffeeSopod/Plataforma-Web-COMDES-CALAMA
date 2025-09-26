import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import IntranetLayout from './layouts/IntranetLayout';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/login';
import Intranet from './pages/Intranet';
import ProtectedRoute from "./auth/ProtectedRoute";
import Perfil from './pages/intranet/perfil/perfil';
import Usuarios from './pages/intranet/usuarios/usuarios';
import NuevoUsuario from './pages/intranet/usuarios/nuevo_usuario';
import Paciente from './pages/intranet/farmacia/paciente';
import Medicamentos from './pages/intranet/farmacia/medicamentos';
import NuevoMedicamento from './pages/intranet/farmacia/nuevo_medicamento';
import NuevaEntrada from './pages/intranet/farmacia/GuiaEntradaNueva';
import Boletas from './pages/intranet/farmacia/boletas/Boletas';
import NuevaBoleta from './pages/intranet/farmacia/boletas/NuevaBoleta';
import Contactos from './pages/ContactosUnidad';
import ScrollToTop from "./components/ScrollToTop";
import CentroSwitch from './pages/CentroSwitch';

const App = () => {
  return (
    <Router>
      <ScrollToTop behavior="smooth" />
      <Routes>
        
        {/* PLATAFORMA WEB */}
        <Route path="/" element={<MainLayout />}>
        
          <Route index element={<Home />} />
          <Route path="quienes-somos" element={<About />} />
          <Route path="contacto" element={<Contact />} />
          <Route path="/centros/:slug" element={<CentroSwitch />} />
          <Route path="/contactos/:slug" element={<Contactos />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* INICIO DE SESION */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>


        {/* INTRANET */}
        <Route element={<IntranetLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/intranet" element={<Intranet />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/intranet/usuarios/nuevo" element={<NuevoUsuario />} />
            <Route path="/intranet/farmacia/paciente" element={<Paciente />} />
            <Route path="/intranet/farmacia/medicamentos" element={<Medicamentos />} />
            <Route path="/intranet/farmacia/medicamentos/nuevo" element={<NuevoMedicamento />} />
            <Route path="/intranet/farmacia/medicamentos/nueva_entrada" element={<NuevaEntrada />} />
            <Route path="/intranet/farmacia/boletas" element={<Boletas />} />
            <Route path="/intranet/farmacia/nueva_boleta" element={<NuevaBoleta />} />
          </Route>
        </Route>

      </Routes>

    </Router>
  );
};




const NotFound = () => {
  return (
    <div className="not-found">
      <div className="container">
        <h1>404 - Página no encontrada</h1>
        <p>Lo sentimos, la página que estás buscando no existe.</p>
      </div>
    </div>
  );
};

export default App;
