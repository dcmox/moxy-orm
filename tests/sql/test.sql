CREATE TABLE Orders (
    ID int NOT NULL,
    OrderNumber int NOT NULL,
    OrderDate date DEFAULT GETDATE()
);

DROP TABLE IF EXISTS `user_session`;
CREATE TABLE `user_session` (
  `user_id` int(11) NOT NULL,
  `session_selector` char(12) NOT NULL,
  `session_verifier` char(64) NOT NULL,
  `user_ip` varchar(255) NOT NULL,
  `expires` datetime NOT NULL,
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `user_pass` varchar(255) CHARACTER SET latin1 NOT NULL,
  `user_salt` varbinary(255) NOT NULL,
  `user_type` enum('personal','commercial') CHARACTER SET latin1 NOT NULL,
  `user_first_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `user_last_name` varchar(255) CHARACTER SET latin1 NOT NULL,
  `user_email` varchar(255) CHARACTER SET latin1 NOT NULL,
  `user_bio` text CHARACTER SET latin1 NOT NULL,
  `access_level` tinyint(4) NOT NULL DEFAULT '0',
  `user_verified` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name` (`user_name`),
  UNIQUE KEY `user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;