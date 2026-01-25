-- =========================================
-- Database init + seed for Mistika
-- =========================================

USE `mistika`;

-- Disable FK checks for clean reset
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;

-- =========================================
-- Admins
-- =========================================
CREATE TABLE `admins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `passwordHash` CHAR(64) NOT NULL,
  `passwordSalt` CHAR(32) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `admins`
(`id`, `username`, `passwordHash`, `passwordSalt`, `isActive`, `createdAt`, `updatedAt`)
VALUES
(1, 'admin', '92250c624aff76ef7940f58824669522602c89fbaddc3c410d08da0c37b32c31', 'e848adffb2191dd2ed8a01cf9ebe6f01', TRUE, NOW(), NOW());

-- =========================================
-- Categories
-- =========================================
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `categories`
(`id`, `name`, `slug`, `description`, `isActive`, `createdAt`, `updatedAt`)
VALUES
(1, 'Velas', 'velas', 'Velas aromáticas artesanales.', TRUE, NOW(), NOW()),
(2, 'Ceras', 'ceras', 'Ceras para fabricación de velas.', TRUE, NOW(), NOW()),
(3, 'Accesorios', 'accesorios', 'Accesorios y complementos.', TRUE, NOW(), NOW());

-- =========================================
-- Products
-- =========================================
CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) DEFAULT NULL,
  `discountPrice` DECIMAL(10,2) DEFAULT NULL,
  `isOnSale` BOOLEAN NOT NULL DEFAULT FALSE,
  `imageUrl` VARCHAR(255) DEFAULT NULL,
  `slug` VARCHAR(255) DEFAULT NULL,
  `categoryId` INT NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `products`
(`id`, `name`, `description`, `price`, `discountPrice`, `isOnSale`, `imageUrl`, `slug`, `categoryId`, `stock`, `isActive`, `createdAt`, `updatedAt`)
VALUES
(1, 'Cera de soya (alto punto de fusión)', 'Cera para velas. Alto punto de fusión.', 115.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-soya-alto-punto-fusion', 2, 50, TRUE, NOW(), NOW()),
(2, 'Cera malasia', 'Cera para velas de alta calidad.', 95.00, 85.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-malasia', 2, 30, TRUE, NOW(), NOW()),
(3, 'Parafina premium china', 'Parafina premium para velas.', 55.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'parafina-premium-china', 2, 100, TRUE, NOW(), NOW()),
(4, 'Bandeja para incienso', 'Bandeja base para varitas de incienso.', 25.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'bandeja-para-incienso', 3, 20, TRUE, NOW(), NOW()),
(5, 'Palo santo (4 varitas)', 'Paquete de 4 varitas de palo santo.', 72.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'palo-santo-4-varitas', 3, 15, TRUE, NOW(), NOW()),
(6, 'Vela aromática violeta', 'Vela aromática con esencia de violeta.', 50.00, 40.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-violeta', 1, 25, TRUE, NOW(), NOW()),
(7, 'Vela aromática rosa', 'Vela aromática con esencia de rosa.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-rosa', 1, 30, TRUE, NOW(), NOW()),
(8, 'Cera de soya (bajo punto de fusión)', 'Cera para velas. Bajo punto de fusión.', 115.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-soya-bajo-punto-fusion', 2, 40, TRUE, NOW(), NOW()),
(9, 'Vela aromática coco', 'Vela aromática con esencia de coco.', 50.00, 45.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-coco', 1, 20, TRUE, NOW(), NOW()),
(10, 'Vela aromática naranja-mandarina', 'Vela aromática cítrica.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-naranja-mandarina', 1, 35, TRUE, NOW(), NOW()),
(11, 'Vela aromática canela', 'Vela aromática con esencia de canela.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-canela', 1, 28, TRUE, NOW(), NOW()),
(12, 'Tabla de madera artesanal', 'Tabla de madera ideal para exhibir velas, incienso o decoración.', 199.00, NULL, FALSE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292020/Tabla_jnknmb.jpg', 'tabla-madera-artesanal', 3, 10, TRUE, NOW(), NOW()),
(13, 'Parafina china estándar', 'Parafina refinada de origen chino para elaboración de velas.', 149.00, NULL, FALSE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292019/ParafinaChina_ji0lvi.jpg', 'parafina-china-estandar', 2, 60, TRUE, NOW(), NOW()),
(14, 'Parafina natural', 'Parafina natural para la fabricación de velas artesanales.', 139.00, NULL, FALSE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292018/Parafina_o4rht6.jpg', 'parafina-natural', 2, 55, TRUE, NOW(), NOW()),
(15, 'Palo santo individual', 'Varita de palo santo para limpieza energética y aromaterapia.', 25.00, NULL, FALSE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292018/PaloSanto_dfktcf.jpg', 'palo-santo-individual', 3, 80, TRUE, NOW(), NOW()),
(16, 'Esencia aromática Malasia', 'Esencia aromática concentrada importada de Malasia para velas.', 189.00, 169.00, TRUE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292017/Malasia_musc8x.jpg', 'esencia-aromatica-malasia', 2, 25, TRUE, NOW(), NOW()),
(17, 'Cera de soya natural', 'Cera de soya ecológica ideal para velas artesanales.', 169.00, NULL, FALSE, 'https://res.cloudinary.com/dpb4rfzui/image/upload/v1769292016/cera-soya-bajo_rjsyjb.jpg', 'cera-soya-natural', 2, 45, TRUE, NOW(), NOW());

-- =========================================
-- Orders
-- =========================================
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderNumber` VARCHAR(50) NOT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shippingCost` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  -- Customer information
  `customerName` VARCHAR(255) NOT NULL,
  `customerEmail` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(50),
  -- Shipping address
  `shippingStreet` VARCHAR(255) NOT NULL,
  `shippingCity` VARCHAR(100) NOT NULL,
  `shippingState` VARCHAR(100) NOT NULL,
  `shippingZip` VARCHAR(20) NOT NULL,
  `shippingCountry` VARCHAR(100) NOT NULL DEFAULT 'México',
  -- Billing address (optional)
  `billingStreet` VARCHAR(255) DEFAULT NULL,
  `billingCity` VARCHAR(100) DEFAULT NULL,
  `billingState` VARCHAR(100) DEFAULT NULL,
  `billingZip` VARCHAR(20) DEFAULT NULL,
  `billingCountry` VARCHAR(100) DEFAULT NULL,
  -- Shipping & Payment
  `shippingMethod` VARCHAR(50) NOT NULL DEFAULT 'standard',
  `paymentMethod` VARCHAR(50) DEFAULT NULL,
  `paymentStatus` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  -- Timestamps
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================================
-- Order items
-- =========================================
CREATE TABLE `order_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderId` INT NOT NULL,
  `productId` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unitPrice` DECIMAL(10,2) NOT NULL,
  `totalPrice` DECIMAL(10,2) NOT NULL,
  `productName` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
