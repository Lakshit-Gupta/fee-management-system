CREATE TABLE Students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    fathers_name VARCHAR(100) NOT NULL,
    registration_no VARCHAR(50) UNIQUE NOT NULL,
    phone_no VARCHAR(15) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    batch_time TIME NOT NULL
);

CREATE TABLE Fees (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES Students(id),
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_status BOOLEAN DEFAULT FALSE
);