-- migrate:up
ALTER TABLE bbs_incidents MODIFY COLUMN location VARCHAR(500) NULL;

-- migrate:down
ALTER TABLE bbs_incidents MODIFY COLUMN location VARCHAR(100) NULL;
