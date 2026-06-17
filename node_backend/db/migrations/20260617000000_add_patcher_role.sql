-- migrate:up
ALTER TABLE admin MODIFY COLUMN level enum('admin','user','mekanik','cs','patcher') NOT NULL;

-- migrate:down
ALTER TABLE admin MODIFY COLUMN level enum('admin','user','mekanik','cs') NOT NULL;
