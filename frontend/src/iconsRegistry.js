// src/iconsRegistry.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  // utilitarios
  faEnvelope,
  faPhone,
  faLocationDot,

  // “fa-xxxx” usados en Contactos y Footer
  faUserTie,
  faBriefcase,
  faUsers,
  faShieldHalved,
  faCoins,
  faDiagramProject,
  faScaleBalanced,
  faStethoscope,
  faBuilding,
  faHospital,
  faFolderOpen, 
  faUserCog, 
  faLink, 
  faBullhorn, 
  faCartShopping, 
  faBalanceScale, 
  faBusinessTime, 
  faMagnifyingGlass, 
  faRightFromBracket, 
  faUser, 
  faPills, 
  faBrush, 
  faNewspaper, 
  faPersonCirclePlus, 
  faReceipt, 

} from "@fortawesome/free-solid-svg-icons";

/** Acceso directo por nombre semántico (opcional) */
export const ICONS = {
  envelope: faEnvelope,
  phone: faPhone,
  locationDot: faLocationDot,
  userTie: faUserTie,
  briefcase: faBriefcase,
  users: faUsers,
  shieldHalved: faShieldHalved,
  coins: faCoins,
  diagramProject: faDiagramProject,
  scaleBalanced: faScaleBalanced,
  stethoscope: faStethoscope,
  building: faBuilding,
  hospital: faHospital,
  folderOpen: faFolderOpen, 
  userCog: faUserCog, 
  link: faLink, 
  bullhorn: faBullhorn, 
  cartShopping: faCartShopping, 
  balanceScale: faBalanceScale, 
  businessTime: faBusinessTime, 
  magnifyingGlass: faMagnifyingGlass, 
  rightFromBracket: faRightFromBracket, 
  user: faUser, 
  pills: faPills, 
  brush: faBrush, 
  newspaper: faNewspaper, 
  personCirclePlus: faPersonCirclePlus, 
  receipt: faReceipt, 
  lotacionDot: faLocationDot,
};

/** Mapa para resolver clases FontAwesome de BD (p.ej. "fa-solid fa-user-tie") */
const FA_BY_CLASS = {
  "fa-user-tie": faUserTie,
  "fa-briefcase": faBriefcase,
  "fa-users": faUsers,
  "fa-shield-halved": faShieldHalved,
  "fa-coins": faCoins,
  "fa-diagram-project": faDiagramProject,
  "fa-scale-balanced": faScaleBalanced,
  "fa-stethoscope": faStethoscope,
  "fa-building": faBuilding,
  "fa-hospital": faHospital,
  // añade aquí cualquier otro "fa-xxx" que vayas a usar
};

/**
 * Recibe strings como "fa-solid fa-user-tie" (o solo "fa-user-tie")
 * y devuelve el icono correspondiente. Si no hay match, usa faBuilding.
 */
export function resolveIcon(iconStr) {
  const parts = String(iconStr || "")
    .split(/\s+/)
    .filter(Boolean);
  const key =
    parts.find(
      (p) =>
        p.startsWith("fa-") &&
        p !== "fa-solid" &&
        p !== "fa-regular" &&
        p !== "fa-brands"
    ) || "fa-building";
  return FA_BY_CLASS[key] || faBuilding;
}

export { FontAwesomeIcon }; // por conveniencia si quieres importar desde aquí

