BEGIN TRANSACTION;

INSERT into users (name, email, entries, joined) values ('Jessie', 'jessie@gmail.com', 5, '2018-01-01');
INSERT into login (hash, email) values ('$2a$10$0y8I3Cs6TA40jO1LPROgf.pA7OXjaP4VkSho5LkLgsVpQNJeXzoVG', 'jessie@gmail.com');

COMMIT;