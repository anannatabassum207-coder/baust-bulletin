
CREATE DATABASE BAUST_Bulletin_DB;
GO

USE BAUST_Bulletin_DB;
GO

---------------------------------------------------
-- USERS TABLE
---------------------------------------------------

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    BAUST_ID VARCHAR(50) NOT NULL UNIQUE,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL
        CHECK (Role IN ('Student', 'Teacher', 'Admin')),
    Department VARCHAR(100),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    IsBlocked BIT DEFAULT 0
);
GO

---------------------------------------------------
-- POSTS TABLE
---------------------------------------------------

CREATE TABLE Posts (
    PostID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Content TEXT NOT NULL,
    ImagePath VARCHAR(255),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    IsDeleted BIT DEFAULT 0,

    CONSTRAINT FK_Posts_Users
    FOREIGN KEY (UserID)
    REFERENCES Users(UserID)
);
GO

---------------------------------------------------
-- COMMENTS TABLE
---------------------------------------------------

CREATE TABLE Comments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    CommentText TEXT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Comments_Posts
    FOREIGN KEY (PostID)
    REFERENCES Posts(PostID),

    CONSTRAINT FK_Comments_Users
    FOREIGN KEY (UserID)
    REFERENCES Users(UserID)
);
GO

---------------------------------------------------
-- LIKES TABLE
---------------------------------------------------

CREATE TABLE Likes (
    LikeID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    LikedAt DATETIME2 DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Likes_Posts
    FOREIGN KEY (PostID)
    REFERENCES Posts(PostID),

    CONSTRAINT FK_Likes_Users
    FOREIGN KEY (UserID)
    REFERENCES Users(UserID),

    CONSTRAINT UQ_User_Post UNIQUE(PostID, UserID)
);
GO

---------------------------------------------------
-- REPORTS TABLE
---------------------------------------------------

CREATE TABLE Reports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    Reason VARCHAR(255) NOT NULL,
    Status VARCHAR(30) DEFAULT 'Pending',
    ReportedAt DATETIME2 DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Reports_Posts
    FOREIGN KEY (PostID)
    REFERENCES Posts(PostID),

    CONSTRAINT FK_Reports_Users
    FOREIGN KEY (UserID)
    REFERENCES Users(UserID)
);
GO

---------------------------------------------------
-- ANNOUNCEMENTS TABLE
---------------------------------------------------

CREATE TABLE Announcements (
    AnnouncementID INT IDENTITY(1,1) PRIMARY KEY,
    AdminID INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),

    CONSTRAINT FK_Announcements_Users
    FOREIGN KEY (AdminID)
    REFERENCES Users(UserID)
);
GO

---------------------------------------------------
-- DEMO USERS
---------------------------------------------------

INSERT INTO Users
(BAUST_ID, FullName, Email, PasswordHash, Role, Department)
VALUES

('2024001', 'Abdullah Al Galib Tonmoy', 'galib@baust.edu.bd', '123456', 'Student', 'CSE'),

('2024002', 'Farha Tabassum Ananna', 'farha@baust.edu.bd', '123456', 'Student', 'CSE'),

('2024003', 'Mrinmoye Rahman', 'mrinmoye@baust.edu.bd', '123456', 'Student', 'CSE'),

('2024004', 'Jacika Jewel Ziniya', 'jacika@baust.edu.bd', '123456', 'Student', 'CSE'),

('2024005', 'Nasim Uddin Shawrab', 'nasim@baust.edu.bd', '123456', 'Student', 'EEE'),

('ADMIN001', 'System Admin', 'admin@baust.edu.bd', 'admin123', 'Admin', 'Administration');
GO

---------------------------------------------------
-- DEMO POSTS
---------------------------------------------------

INSERT INTO Posts (UserID, Content)
VALUES
(1, 'Welcome to BAUST Bulletin platform!'),
(2, 'Today CSE class will start at 10 AM.'),
(3, 'Anyone interested in ACM contest practice?'),
(4, 'Lost ID card near cafeteria.'),
(5, 'EEE department seminar tomorrow.');
GO

---------------------------------------------------
-- DEMO COMMENTS
---------------------------------------------------

INSERT INTO Comments (PostID, UserID, CommentText)
VALUES
(1, 2, 'Great project idea!'),
(2, 1, 'Thanks for the update.'),
(3, 4, 'I want to join the contest practice.');
GO

---------------------------------------------------
-- DEMO LIKES
---------------------------------------------------

INSERT INTO Likes (PostID, UserID)
VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 5);
GO

---------------------------------------------------
-- DEMO ANNOUNCEMENT
---------------------------------------------------

INSERT INTO Announcements (AdminID, Title, Content)
VALUES
(6, 'Mid Exam Notice', 'Mid exams will start from next Sunday.');
GO

---------------------------------------------------
-- CHECK DATA
---------------------------------------------------

SELECT * FROM Users;
SELECT * FROM Posts;
SELECT * FROM Comments;
SELECT * FROM Likes;
SELECT * FROM Reports;
SELECT * FROM Announcements;
GO