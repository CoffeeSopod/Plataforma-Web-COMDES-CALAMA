// src/pages/centros/CentroSwitch.jsx
import React from "react";
import { useParams } from "react-router-dom";
import CentroGenerico from "./centro_salud";          // tu layout estándar (sin switch)
import FarmaciaCiudadanaPage from "./FarmaciaCiudadana"; // el layout especial

export default function CentroSwitch() {
  const { slug } = useParams();
  return slug === "farmacia-ciudadana" ? (
    <FarmaciaCiudadanaPage />
  ) : (
    <CentroGenerico />
  );
}
