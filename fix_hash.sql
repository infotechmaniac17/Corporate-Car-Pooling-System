UPDATE users
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE id = 1;

SELECT id, email, LEFT(password_hash, 20) AS hash_start FROM users WHERE id = 1;
