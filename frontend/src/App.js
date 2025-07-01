import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
// Estas páginas aún no están implementadas
// import News from './pages/News';
// import NewsDetail from './pages/NewsDetail';
// import Services from './pages/Services';
// import ServiceDetail from './pages/ServiceDetail';
// import Intranet from './pages/Intranet';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="quienes-somos" element={<About />} />
          <Route path="contacto" element={<Contact />} />
          {/* Rutas pendientes por implementar */}
          {/* <Route path="comdes-al-dia" element={<News />} /> */}
          {/* <Route path="comdes-al-dia/:id" element={<NewsDetail />} /> */}
          {/* <Route path="servicios" element={<Services />} /> */}
          {/* <Route path="servicios/:id" element={<ServiceDetail />} /> */}
          {/* <Route path="intranet" element={<Intranet />} /> */}
          
          {/* Ruta para manejar 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

// Componente simple para página no encontrada
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
