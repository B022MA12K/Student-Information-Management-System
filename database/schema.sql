-- Student Information Management System
-- Import in phpMyAdmin (Import tab) or paste into the SQL tab, then click Go.

CREATE DATABASE IF NOT EXISTS school_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE school_db;

CREATE TABLE IF NOT EXISTS students (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(20)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  course      VARCHAR(100),
  year_level  TINYINT      NOT NULL DEFAULT 1,
  status      ENUM('Active', 'Inactive', 'Graduated') NOT NULL DEFAULT 'Active',
  photo       VARCHAR(255) NULL,           -- file name inside server/uploads
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  role          ENUM('admin', 'staff', 'student') NOT NULL,
  student_ref   INT NULL UNIQUE,           -- a student account points to one student record
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Only one row can have role = 'admin': the unique key below allows a single 1.
  admin_slot    TINYINT GENERATED ALWAYS AS (CASE WHEN role = 'admin' THEN 1 ELSE NULL END) VIRTUAL,
  UNIQUE KEY uq_single_admin (admin_slot),
  CONSTRAINT fk_users_student FOREIGN KEY (student_ref)
    REFERENCES students(id) ON DELETE SET NULL
);
