-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 05-09-2025 a las 18:14:19
-- Versión del servidor: 9.1.0
-- Versión de PHP: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `comdes`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `centros_salud`
--

DROP TABLE IF EXISTS `centros_salud`;
CREATE TABLE IF NOT EXISTS `centros_salud` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `nombre_salud` varchar(160) NOT NULL,
  `url_banner` varchar(512) DEFAULT NULL,
  `url_logo` varchar(512) DEFAULT NULL,
  `nombres_e` varchar(120) DEFAULT NULL,
  `ap_pat_e` varchar(120) DEFAULT NULL,
  `ap_mat_e` varchar(120) DEFAULT NULL,
  `cargo_e` varchar(160) DEFAULT NULL,
  `telefono` varchar(40) DEFAULT NULL,
  `correo` varchar(160) DEFAULT NULL,
  `h_atencion` varchar(300) DEFAULT NULL,
  `quienes_somos` mediumtext,
  `mision` mediumtext,
  `vision` mediumtext,
  `direccion` varchar(200) DEFAULT NULL,
  `url_frente` varchar(512) DEFAULT NULL,
  `mapa_embed` varchar(2048) DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `centros_salud`
--

INSERT INTO `centros_salud` (`id`, `slug`, `nombre_salud`, `url_banner`, `url_logo`, `nombres_e`, `ap_pat_e`, `ap_mat_e`, `cargo_e`, `telefono`, `correo`, `h_atencion`, `quienes_somos`, `mision`, `vision`, `direccion`, `url_frente`, `mapa_embed`, `creado_en`, `actualizado_en`) VALUES
(1, 'cesfam-enrique-montt', 'CESFAM Enrique Montt', '/assets/images/centros/cesfam/enrique_montt/banner.png', '/assets/images/centros/cesfam/enrique_montt/logo_enrique_montt.png', 'Carolina', 'Guajardo', NULL, 'Encargada', '+55 2 655650', 'cguajardo@comdescalama.cl', 'Lunes a jueves: 8:00 a 17:00 hrs\nViernes: 8:00 a 16:00 hrs', 'El CESFAM Enrique Montt inicia sus funciones en los años 80 en una sede Junta de vecinos de la población Bernardo O’Higgins, llamándose Consultorio Pablo Ponce.\n\nLuego entre los años 1982 y 1992 traslada sus funciones hacia la sede de la Junta de Vecinos de la población Independencia, como Consultorio Enrique Montt, en honor a un médico destacado en esta zona.\n\nEl 13 abril 1992 se inaugura el Establecimiento definitivo en la Avenida Granaderos número 3698 y a partir del año 2004 se anexa en forma permanente a nuestro quehacer la posta del pueblo de Caspana. A partir del año 2008 se convierte en el primer CESFAM de la provincia EL LOA.\nCuenta con 2 sectores Verde y Celeste, más Posta Del Pueblo de Caspana.', 'Otorgar atenciones con enfoque biopsicosocial a las familias inscritas, a lo largo de su ciclo vital contando para ellos con recurso humano competente, equipamiento einsumos requeridos, asegurando altos niveles de calidad y eficiencia, basándonos a los principios éticos y asegurando la mejora continua de nuestros servicios.', 'Ser el centro de salud familiar de elección de los usuarios FONASA, a los que se le ofrece una atención de calidad, que satisfaga las expectativas y necesidades de salud de estos, entregadas por profesionales calificados e integrada en un proceso de continuidad asistencial y mejora continua; ser un buen lugar para trabajar.', 'Av. Granaderos #3698, Calama', '/assets/images/centros/cesfam/enrique_montt/fachada.png', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3687.6409978996408!2d-68.92997212379113!3d-22.442534221446067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96ac09ec810bbbf1%3A0xb5d5a2d12ef8a462!2sCESFAM%20Enrique%20Montt%20-%20Comdes%20Calama!5e0!3m2!1ses-419!2scl!4v1756911074210!5m2!1ses-419!2scl', '2025-09-03 14:49:16', '2025-09-03 15:39:41'),
(2, 'cesfam-central', 'CESFAM Central', '/assets/images/centros/cesfam/central/banner.png', '/assets/images/centros/cesfam/central/logo_cesfam_central.png', 'Verónica', 'Pinto', 'Herrera', 'Directora Ejecutiva', '552987200', 'central@comdescalama.cl', 'Lunes a jueves 8:00 a 17:00 hrs.\r\nViernes 8:00 a 16:00 hrs.', '\"SIN INFORMACION POR EL MOMENTO\"', 'Brindar  una atención cálida, humana, oportuna, integral, con enfoque biopsicosocial y de calidad, en cada prestación de salud, con una orientación comunitaria y de participación, con personal altamente capacitado, priorizando los programas preventivos y promocionales, contribuyendo a mejorar los niveles de bienestar de nuestra población.\r\n', 'Ser el Centro de Salud Familiar modelo en la región, con un equipo que trabaja combinando atención clínica efectiva con un trabajo centrado en la familia y la comunidad, con usuarios plenamente satisfechos en sus necesidades, lo que permita elevar el nivel de salud de nuestra población.', 'Anibal Pinto 2255, Calama', '/assets/images/centros/cesfam/central/fachada.png', NULL, '2025-09-03 16:51:01', '2025-09-03 16:51:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conversations`
--

DROP TABLE IF EXISTS `conversations`;
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `type` enum('dm','room') NOT NULL DEFAULT 'dm',
  `name` varchar(160) DEFAULT NULL,
  `owner_id` bigint DEFAULT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lastmsg` (`last_message_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conversation_participants`
--

DROP TABLE IF EXISTS `conversation_participants`;
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `conversation_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`conversation_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `medicamento`
--

DROP TABLE IF EXISTS `medicamento`;
CREATE TABLE IF NOT EXISTS `medicamento` (
  `id` varchar(100) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `princ_act` text,
  `lote` varchar(255) DEFAULT NULL,
  `f_ven` date NOT NULL,
  `proveedor` varchar(255) DEFAULT NULL,
  `cantidad` int NOT NULL DEFAULT '0',
  `f_regis` date NOT NULL,
  `estado` enum('habilitado','restringido') NOT NULL DEFAULT 'habilitado',
  `img` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `medicamento`
--

INSERT INTO `medicamento` (`id`, `nombre`, `princ_act`, `lote`, `f_ven`, `proveedor`, `cantidad`, `f_regis`, `estado`, `img`) VALUES
('VL0001', 'ACICLOVIR 200 MG.24 COMP', 'ACICLOVIR 200MG.24 COM', 'D240535', '2029-04-25', 'MITLAB', 1, '2025-09-02', 'habilitado', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `sender_id` bigint NOT NULL,
  `content` text,
  `attachments` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conv_created` (`conversation_id`,`created_at` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

DROP TABLE IF EXISTS `paciente`;
CREATE TABLE IF NOT EXISTS `paciente` (
  `rut` varchar(100) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `ap_pat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ap_mat` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `prevision` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `f_nac` date DEFAULT NULL,
  `tel_fijo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `celular` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `f_inscrip` date DEFAULT NULL,
  `f_receta` date DEFAULT NULL,
  PRIMARY KEY (`rut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`rut`, `nombres`, `ap_pat`, `ap_mat`, `prevision`, `f_nac`, `tel_fijo`, `celular`, `f_inscrip`, `f_receta`) VALUES
('13529299-0', 'YOLANDA', 'GODOY', 'GONZALEZ', 'FONASA B', '1979-05-04', '', '983152770', '2023-01-05', '2023-04-17'),
('14564253-1', 'MARIA', 'PAEZ', 'CONTRERAS', 'FONASA B', '1981-11-09', '', '982584514', '2023-01-06', '2022-12-20'),
('168689019-5', 'KARINA', 'MOLINA', 'OCHOA', 'FONASA C', '1988-01-17', '', '976152239', '2023-01-10', '2022-10-28'),
('22771497-2', 'MATIAS', 'ALBORNOZ', 'FUENTES', 'FONASA B', '2008-07-19', '', '963538794', '2023-01-06', '2023-04-04'),
('24126040-2', 'WILFREDO', 'MONTAÑO', 'GODOY', 'FONASA D', '1970-09-04', '', '979722194', '2023-01-12', '2023-01-09'),
('3299048-7', 'FELIX', 'BARBOZA', 'ROBLEDO', 'FONASA B', '1936-05-18', '', '998661505', '2025-04-30', '2025-01-17'),
('5291904-5', 'MARIA', 'VILCA', 'VILCA', 'FONASA B', '1944-11-26', '552830425', NULL, '2016-02-15', '2018-06-26'),
('6826634-1', 'TERESA', 'AYAVIRE', 'BERNA', 'FONASA B', '1950-10-15', '', NULL, '2024-04-04', '2024-03-07'),
('7069599-5', 'CORINA', 'ALCAYAGA', 'AGUIRRE', 'ISAPRE ISALUD', '1954-04-22', '', '931740691', '2023-01-09', '2022-12-30'),
('8134301-2', 'BEATRIZ', 'FUENTES', '', 'I. ISALUD', '1959-01-28', '', '988936442', '2024-04-12', '2024-04-09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

DROP TABLE IF EXISTS `rol`;
CREATE TABLE IF NOT EXISTS `rol` (
  `id` int NOT NULL,
  `nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id`, `nombre`) VALUES
(0, 'Usuario'),
(1, 'Administrador');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shortcut`
--

DROP TABLE IF EXISTS `shortcut`;
CREATE TABLE IF NOT EXISTS `shortcut` (
  `id` varchar(64) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `descripcion` varchar(300) DEFAULT NULL,
  `url` varchar(500) NOT NULL,
  `externo` tinyint(1) NOT NULL DEFAULT '0',
  `icon_pack` enum('fas','far','fab') DEFAULT 'fas',
  `icon_name` varchar(50) NOT NULL,
  `grupo` varchar(60) DEFAULT NULL,
  `orden` int NOT NULL DEFAULT '0',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shortcut_grupo` (`grupo`,`orden`,`titulo`),
  KEY `idx_shortcut_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `shortcut`
--

INSERT INTO `shortcut` (`id`, `titulo`, `descripcion`, `url`, `externo`, `icon_pack`, `icon_name`, `grupo`, `orden`, `activo`, `created_at`, `updated_at`) VALUES
('accesos', 'Gestor de Accesos Directos', 'Administra accesos visibles en la intranet.', '/intranet/accesos', 0, 'fas', 'link', 'Administración', 20, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('autoconsulta', 'Autoconsulta', 'Consulta datos personales y permisos.', 'http://tempo.comdescalama.cl/TempoNet/Account/Login/', 1, 'fas', 'magnifyingGlass', 'General', 50, 1, '2025-09-02 15:54:04', '2025-09-02 16:38:29'),
('avisos', 'Gestor de Tablón de avisos', 'Gestiona los avisos internos de la intranet.', '/intranet/avisos', 0, 'fas', 'bullhorn', 'Administración', 30, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('banner', 'Banner Plataforma Web', 'Gestiona los banners de la web.', '/intranet/contenidos/banner', 0, 'fas', 'brush', 'Comunicación', 10, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('boletas', 'Emisión de Boletas', 'Emite boletas de farmacia.', '/intranet/farmacia/boletas', 0, 'fas', 'receipt', 'Farmacia', 30, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('compras', 'Compras Públicas', 'Gestiona compras en mercadopublico.cl.', 'https://www.mercadopublico.cl/Portal/Modules/Site/Busquedas/ResultadoBusqueda.aspx?qs=1&IdEmpresa=nR/LAf|fFJ8=', 1, 'fas', 'cartShopping', 'Administración', 40, 1, '2025-09-02 15:54:04', '2025-09-02 16:38:35'),
('correo', 'Correo Institucional', 'Revisa tu bandeja, agenda reuniones y más.', 'https://www.comdescalama.cl:2096/', 1, 'fas', 'envelope', 'General', 10, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('farmacia-invent', 'Inventario Farmacia', 'Consulta y registra stock de medicamentos.', '/intranet/farmacia/medicamentos', 0, 'fas', 'pills', 'Farmacia', 10, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('geovictoria', 'GeoVictoria', 'Control de asistencia corporativa.', 'https://clients.geovictoria.com/account/login?idiom=es', 1, 'fas', 'lotacionDot', 'General', 40, 1, '2025-09-02 15:54:04', '2025-09-02 16:41:30'),
('noticias', 'Noticias COMDES', 'Registra y gestiona noticias.', '/intranet/contenidos/noticias', 0, 'fas', 'newspaper', 'Comunicación', 20, 1, '2025-09-02 15:54:04', '2025-09-02 15:54:04'),
('pacientes', 'Pacientes', 'Gestiona pacientes de farmacia ciudadana.', '/intranet/farmacia/paciente', 0, 'fas', 'personCirclePlus', 'Farmacia', 20, 1, '2025-09-02 15:54:04', '2025-09-03 08:56:30'),
('transparencia', 'Transparencia Activa', 'Documentos y datos públicos de COMDES.', 'https://www.portaltransparencia.cl/PortalPdT/directorio-de-organismos-regulados/?org=CM018', 1, 'fas', 'balanceScale', 'General', 30, 1, '2025-09-02 15:54:04', '2025-09-02 16:38:50'),
('usuarios', 'Gestionar Usuarios', 'Registra usuarios y gestiona permisos.', '/usuarios', 0, 'fas', 'userCog', 'Administración', 10, 1, '2025-09-02 15:54:04', '2025-09-02 16:37:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shortcut_role`
--

DROP TABLE IF EXISTS `shortcut_role`;
CREATE TABLE IF NOT EXISTS `shortcut_role` (
  `shortcut_id` varchar(64) NOT NULL,
  `rol_id` int NOT NULL,
  PRIMARY KEY (`shortcut_id`,`rol_id`),
  KEY `idx_sr_rol` (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `shortcut_role`
--

INSERT INTO `shortcut_role` (`shortcut_id`, `rol_id`) VALUES
('accesos', 1),
('avisos', 1),
('usuarios', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shortcut_unidad`
--

DROP TABLE IF EXISTS `shortcut_unidad`;
CREATE TABLE IF NOT EXISTS `shortcut_unidad` (
  `shortcut_id` varchar(64) NOT NULL,
  `unidad_id` int NOT NULL,
  PRIMARY KEY (`shortcut_id`,`unidad_id`),
  KEY `idx_su_unidad` (`unidad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `shortcut_unidad`
--

INSERT INTO `shortcut_unidad` (`shortcut_id`, `unidad_id`) VALUES
('farmacia-invent', 7),
('pacientes', 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `shortcut_user`
--

DROP TABLE IF EXISTS `shortcut_user`;
CREATE TABLE IF NOT EXISTS `shortcut_user` (
  `shortcut_id` varchar(64) NOT NULL,
  `rut` varchar(12) NOT NULL,
  `allow` tinyint(1) NOT NULL,
  PRIMARY KEY (`shortcut_id`,`rut`),
  KEY `idx_su_user` (`rut`,`allow`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `shortcut_user`
--

INSERT INTO `shortcut_user` (`shortcut_id`, `rut`, `allow`) VALUES
('usuarios', '20274732-9', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidad`
--

DROP TABLE IF EXISTS `unidad`;
CREATE TABLE IF NOT EXISTS `unidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `costo_centro` int NOT NULL,
  `ubicacion` enum('No Asignado','Unidad Central','Salud') NOT NULL DEFAULT 'No Asignado',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `unidad`
--

INSERT INTO `unidad` (`id`, `nombre`, `costo_centro`, `ubicacion`) VALUES
(0, 'Unidad No Asignada', 0, 'No Asignado'),
(1, 'Dirección Ejecutiva', 0, 'Unidad Central'),
(2, 'Unidad de Administración', 0, 'Unidad Central'),
(3, 'Unidad de Control y Gestión Institucional', 0, 'Unidad Central'),
(4, 'Unidad de Control Interno', 0, 'Unidad Central'),
(5, 'Unidad de Recursos Humanos', 0, 'Unidad Central'),
(6, 'Unidad de Finanzas', 0, 'Unidad Central'),
(7, 'Unidad de Informática', 0, 'Unidad Central'),
(8, 'Unidad de Planificación', 0, 'Unidad Central'),
(9, 'Unidad de Comunicaciones', 0, 'Unidad Central');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

DROP TABLE IF EXISTS `usuario`;
CREATE TABLE IF NOT EXISTS `usuario` (
  `rut` varchar(12) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellido_paterno` varchar(255) NOT NULL,
  `apellido_materno` varchar(255) NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `cargo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '"Sin Cargo Asignado"',
  `last_seen` datetime DEFAULT NULL,
  `correo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '"Sin Correo Asignado"	',
  `telefono` int DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol_id` int NOT NULL,
  `id_unidad` int DEFAULT '0',
  PRIMARY KEY (`rut`),
  KEY `fk_usuario_rol` (`rol_id`),
  KEY `fk_usuario_unidad` (`id_unidad`),
  KEY `idx_usuario_last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`rut`, `nombres`, `apellido_paterno`, `apellido_materno`, `fecha_nacimiento`, `cargo`, `last_seen`, `correo`, `telefono`, `password`, `rol_id`, `id_unidad`) VALUES
('11111111-1', 'dummy', 'dummy', 'dummy', '2025-09-02', '\"Sin Cargo Asignado\"', '2025-09-03 09:41:53', 'dummy@comdescalama.cl', 552711, '$2a$12$CjdLBE6iRYBod3wwvAleZOkrcmVrnzxX59L09J/Ctcm5NXCFkUh1i', 0, 0),
('20093818-6', 'Luis', 'Castro', 'Ahumada', '1999-03-30', 'Soporte Técnico Informático', NULL, 'luis.castro@comdescalama.cl', 552711860, '$2a$12$.yWP.2rmcLBxVQadQBYeKOUARpLulOT/rtqX1iK8J7tQfkUxcSLJa', 1, 7),
('20274732-9', 'Joseph Benjamín', 'Ramírez', 'Catalán', '1999-09-29', 'Soporte Técnico Informático', '2025-09-05 14:00:17', 'joseph.ramirez@comdescalama.cl', 552711860, '$2a$12$ORPdm0GI1pkvFzxdZLkqqO/5C9UenEFgYOwLf4U9XwF70s/QimmeO', 1, 7);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `_schema_migrations`
--

DROP TABLE IF EXISTS `_schema_migrations`;
CREATE TABLE IF NOT EXISTS `_schema_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `filename` (`filename`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `_schema_migrations`
--

INSERT INTO `_schema_migrations` (`id`, `filename`, `applied_at`) VALUES
(1, '20250820_0001_bbdd.sql', '2025-08-20 15:40:22'),
(2, '20250820_0002_bbdd.sql', '2025-08-20 16:45:38'),
(3, '20250820_0003_bbdd.sql', '2025-08-25 16:18:25'),
(4, '20250820_0004_bbdd.sql', '2025-08-27 13:51:49');

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `shortcut_role`
--
ALTER TABLE `shortcut_role`
  ADD CONSTRAINT `fk_sr_shortcut` FOREIGN KEY (`shortcut_id`) REFERENCES `shortcut` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `shortcut_unidad`
--
ALTER TABLE `shortcut_unidad`
  ADD CONSTRAINT `fk_su_shortcut` FOREIGN KEY (`shortcut_id`) REFERENCES `shortcut` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `shortcut_user`
--
ALTER TABLE `shortcut_user`
  ADD CONSTRAINT `fk_suser_shortcut` FOREIGN KEY (`shortcut_id`) REFERENCES `shortcut` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
