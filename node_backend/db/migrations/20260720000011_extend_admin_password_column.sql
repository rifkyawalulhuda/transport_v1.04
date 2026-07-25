-- migrate:up
ALTER TABLE `admin` MODIFY COLUMN `password` VARCHAR(255) NOT NULL;

-- migrate:down
ALTER TABLE `admin` MODIFY COLUMN `password` VARCHAR(50) NOT NULL;
