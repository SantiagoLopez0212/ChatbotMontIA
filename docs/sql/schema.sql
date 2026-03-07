-- ============================================================
-- Base de datos para MontIA Chatbot Académico
-- Ejecutar en MySQL Workbench (pestaña SQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS `proyecto_chatbot`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `proyecto_chatbot`;

-- ────────────────────────────────────────────
-- Tabla de usuarios
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────
-- Tabla de conversaciones
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) DEFAULT 'Nueva conversación',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────
-- Tabla de mensajes
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `conversation_id` INT NOT NULL,
  `sender` ENUM('user', 'bot') NOT NULL,
  `content` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────
-- Tabla de recuperación de contraseña
-- ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(6) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────
-- Usuario admin opcional (cambia el email/clave antes de ejecutar)
-- ────────────────────────────────────────────
-- INSERT INTO users (name, email, password)
-- VALUES ('Admin', 'admin@demo.com', '$2a$10$fQdF3SIg0D6mJwJf8rOOKO1PM2JgS8Jm1A09xkHjJ1b8E2bXSYnse');
-- La contraseña hash corresponde a:  admin123
