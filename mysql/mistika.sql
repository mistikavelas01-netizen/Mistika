-- Database is created automatically by MariaDB via MARIADB_DATABASE env var
-- Just ensure we're using the correct database
USE `mistika`;

DROP TABLE IF EXISTS `products`;

CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) DEFAULT NULL,
  `imageUrl` VARCHAR(255) DEFAULT NULL,
  `slug` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'General',
  `stock` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `products` 
(`id`, `name`, `description`, `price`, `imageUrl`, `slug`, `category`, `stock`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1,'Soy wax (high melting point)','Wax for candles. High melting point.',115.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','soy-wax-high-melting-point','Waxes',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:31:03'),
(2,'Malaysian wax','Wax for candles.',95.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','malaysian-wax','Waxes',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(3,'Chinese premium paraffin','Premium paraffin for candles.',55.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','premium-chinese-paraffin','Waxes',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(4,'Incense tray','Base tray for incense sticks.',25.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','incense-tray','Accessories',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(5,'Palo santo (4 sticks)','Pack of 4 palo santo sticks.',72.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','palo-santo-4-sticks','Accessories',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(6,'Violet aromatic candle','Aromatic candle.',50.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','violet-aromatic-candle','Candles',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(7,'Rose aromatic candle','Aromatic candle.',50.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','rose-aromatic-candle','Candles',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(8,'Soy wax (low melting point)','Wax for candles. Low melting point.',115.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','soy-wax-low-melting-point','Waxes',0,TRUE,'2026-01-18 19:44:31','2026-01-18 19:55:57'),
(9,'Coconut aromatic candle','Aromatic candle.',50.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','coconut-aromatic-candle','Candles',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:17:47'),
(10,'Orange-mandarin aromatic candle','Aromatic candle.',50.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','orange-mandarin-aromatic-candle','Candles',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:31:03'),
(11,'Cinnamon aromatic candle','Aromatic candle.',50.00,'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg','cinnamon-aromatic-candle','Candles',0,TRUE,'2026-01-18 19:44:31','2026-01-18 20:31:03');
