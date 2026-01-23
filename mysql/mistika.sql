-- Database is created automatically by MariaDB via MARIADB_DATABASE env var
-- Just ensure we're using the correct database
USE `mistika`;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;

-- Create admins table
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

-- Create categories table
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

-- Insert admin (username: admin, password: admin123)
INSERT INTO `admins`
(`id`, `username`, `passwordHash`, `passwordSalt`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'admin', '92250c624aff76ef7940f58824669522602c89fbaddc3c410d08da0c37b32c31', 'e848adffb2191dd2ed8a01cf9ebe6f01', TRUE, NOW(), NOW());

-- Create products table
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
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create orders table
CREATE TABLE `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `orderNumber` VARCHAR(50) NOT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `totalAmount` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shippingCost` DECIMAL(10,2) NOT NULL,
  `tax` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `customerName` VARCHAR(255) NOT NULL,
  `customerEmail` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(50) DEFAULT NULL,
  `shippingStreet` VARCHAR(255) NOT NULL,
  `shippingCity` VARCHAR(100) NOT NULL,
  `shippingState` VARCHAR(100) NOT NULL,
  `shippingZip` VARCHAR(20) NOT NULL,
  `shippingCountry` VARCHAR(100) NOT NULL DEFAULT 'México',
  `billingStreet` VARCHAR(255) DEFAULT NULL,
  `billingCity` VARCHAR(100) DEFAULT NULL,
  `billingState` VARCHAR(100) DEFAULT NULL,
  `billingZip` VARCHAR(20) DEFAULT NULL,
  `billingCountry` VARCHAR(100) DEFAULT NULL,
  `shippingMethod` VARCHAR(50) NOT NULL DEFAULT 'standard',
  `paymentMethod` VARCHAR(50) DEFAULT NULL,
  `paymentStatus` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `notes` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create order_items table
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
  FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert categories
INSERT INTO `categories` 
(`id`, `name`, `slug`, `description`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'Velas', 'velas', 'Velas aromáticas artesanales para crear ambientes relajantes y acogedores.', TRUE, NOW(), NOW()),
(2, 'Ceras', 'ceras', 'Ceras de alta calidad para la fabricación de velas artesanales.', TRUE, NOW(), NOW()),
(3, 'Accesorios', 'accesorios', 'Accesorios y complementos para rituales y decoración.', TRUE, NOW(), NOW());

-- Insert products (now with categoryId instead of category)
INSERT INTO `products` 
(`id`, `name`, `description`, `price`, `discountPrice`, `isOnSale`, `imageUrl`, `slug`, `categoryId`, `stock`, `isActive`, `createdAt`, `updatedAt`) VALUES
(1, 'Cera de soya (alto punto de fusión)', 'Cera para velas. Alto punto de fusión.', 115.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-soya-alto-punto-fusion', 2, 50, TRUE, NOW(), NOW()),
(2, 'Cera malasia', 'Cera para velas de alta calidad.', 95.00, 85.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-malasia', 2, 30, TRUE, NOW(), NOW()),
(3, 'Parafina premium china', 'Parafina premium para velas.', 55.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'parafina-premium-china', 2, 100, TRUE, NOW(), NOW()),
(4, 'Bandeja para incienso', 'Bandeja base para varitas de incienso.', 25.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'bandeja-para-incienso', 3, 20, TRUE, NOW(), NOW()),
(5, 'Palo santo (4 varitas)', 'Paquete de 4 varitas de palo santo.', 72.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'palo-santo-4-varitas', 3, 15, TRUE, NOW(), NOW()),
(6, 'Vela aromática violeta', 'Vela aromática con esencia de violeta para relajación y armonía.', 50.00, 40.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-violeta', 1, 25, TRUE, NOW(), NOW()),
(7, 'Vela aromática rosa', 'Vela aromática con esencia de rosa para crear un ambiente romántico y cálido.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-rosa', 1, 30, TRUE, NOW(), NOW()),
(8, 'Cera de soya (bajo punto de fusión)', 'Cera para velas. Bajo punto de fusión.', 115.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'cera-soya-bajo-punto-fusion', 2, 40, TRUE, NOW(), NOW()),
(9, 'Vela aromática coco', 'Vela aromática con esencia de coco para un ambiente tropical y relajante.', 50.00, 45.00, TRUE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-coco', 1, 20, TRUE, NOW(), NOW()),
(10, 'Vela aromática naranja-mandarina', 'Vela aromática con esencia cítrica de naranja y mandarina para energía y frescura.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-naranja-mandarina', 1, 35, TRUE, NOW(), NOW()),
(11, 'Vela aromática canela', 'Vela aromática con esencia de canela para un ambiente cálido y acogedor.', 50.00, NULL, FALSE, 'https://res.cloudinary.com/teamvibe/image/upload/businessol/businessonline-logo.jpg', 'vela-aromatica-canela', 1, 28, TRUE, NOW(), NOW());

-- Insert sample orders
INSERT INTO `orders` 
(`id`, `orderNumber`, `status`, `totalAmount`, `subtotal`, `shippingCost`, `tax`, `customerName`, `customerEmail`, `customerPhone`, `shippingStreet`, `shippingCity`, `shippingState`, `shippingZip`, `shippingCountry`, `billingStreet`, `billingCity`, `billingState`, `billingZip`, `billingCountry`, `shippingMethod`, `paymentMethod`, `paymentStatus`, `notes`, `createdAt`, `updatedAt`) VALUES
(1, 'MIST-20260118-1234', 'pending', 195.00, 165.00, 150.00, 26.40, 'María González', 'maria.gonzalez@email.com', '+52 55 1234 5678', 'Av. Reforma 123', 'Ciudad de México', 'CDMX', '06600', 'México', NULL, NULL, NULL, NULL, NULL, 'standard', 'card', 'pending', 'Por favor entregar en horario de oficina', NOW(), NOW()),
(2, 'MIST-20260118-5678', 'processing', 320.00, 270.00, 150.00, 43.20, 'Juan Pérez', 'juan.perez@email.com', '+52 55 9876 5432', 'Calle Principal 456', 'Guadalajara', 'Jalisco', '44100', 'México', 'Calle Principal 456', 'Guadalajara', 'Jalisco', '44100', 'México', 'express', 'transfer', 'paid', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(3, 'MIST-20260117-9012', 'shipped', 445.00, 395.00, 250.00, 63.20, 'Ana Martínez', 'ana.martinez@email.com', '+52 55 5555 1234', 'Boulevard Norte 789', 'Monterrey', 'Nuevo León', '64000', 'México', NULL, NULL, NULL, NULL, NULL, 'express', 'card', 'paid', 'Regalo de cumpleaños', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(4, 'MIST-20260115-3456', 'delivered', 180.00, 150.00, 150.00, 24.00, 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '+52 55 4444 5678', 'Calle Sur 321', 'Puebla', 'Puebla', '72000', 'México', NULL, NULL, NULL, NULL, NULL, 'standard', 'cash', 'paid', NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 8 DAY));

-- Insert order items
INSERT INTO `order_items` 
(`id`, `orderId`, `productId`, `quantity`, `unitPrice`, `totalPrice`, `productName`, `createdAt`) VALUES
-- Order 1 items
(1, 1, 6, 2, 40.00, 80.00, 'Vela aromática violeta', NOW()),
(2, 1, 7, 1, 50.00, 50.00, 'Vela aromática rosa', NOW()),
(3, 1, 4, 1, 25.00, 25.00, 'Bandeja para incienso', NOW()),
(4, 1, 5, 1, 72.00, 72.00, 'Palo santo (4 varitas)', NOW()),
-- Order 2 items
(5, 2, 1, 1, 115.00, 115.00, 'Cera de soya (alto punto de fusión)', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6, 2, 2, 1, 85.00, 85.00, 'Cera malasia', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(7, 2, 6, 1, 40.00, 40.00, 'Vela aromática violeta', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(8, 2, 9, 1, 45.00, 45.00, 'Vela aromática coco', DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- Order 3 items
(9, 3, 1, 2, 115.00, 230.00, 'Cera de soya (alto punto de fusión)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(10, 3, 8, 1, 115.00, 115.00, 'Cera de soya (bajo punto de fusión)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, 3, 7, 1, 50.00, 50.00, 'Vela aromática rosa', DATE_SUB(NOW(), INTERVAL 5 DAY)),
-- Order 4 items
(12, 4, 10, 2, 50.00, 100.00, 'Vela aromática naranja-mandarina', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(13, 4, 11, 1, 50.00, 50.00, 'Vela aromática canela', DATE_SUB(NOW(), INTERVAL 10 DAY));
