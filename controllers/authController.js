const { sql, poolPromise } = require("../config/db");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("Email", sql.VarChar, email)
      .input("PasswordHash", sql.VarChar, password)
      .query(`
        SELECT * FROM Users
        WHERE Email = @Email 
        AND PasswordHash = @PasswordHash 
        AND IsBlocked = 0
      `);

    if (result.recordset.length === 0) {
      return res.send("Invalid email or password");
    }

    req.session.user = result.recordset[0];

    if (req.session.user.Role === "Admin") {
      return res.redirect("/admin/dashboard");
    }

    res.redirect("/posts/feed");
  } catch (err) {
    console.log(err);
    res.send("Login error");
  }
};

exports.register = async (req, res) => {
  try {
    const { baust_id, fullname, email, password, role, department } = req.body;
    const profileImage = req.file
      ? "/uploads/profiles/" + req.file.filename
      : "/uploads/profiles/default.png";

    const pool = await poolPromise;

    await pool
      .request()
      .input("BAUST_ID", sql.VarChar, baust_id)
      .input("FullName", sql.VarChar, fullname)
      .input("Email", sql.VarChar, email)
      .input("PasswordHash", sql.VarChar, password)
      .input("Role", sql.VarChar, role)
      .input("Department", sql.VarChar, department)
      .input("ProfileImage", sql.VarChar, profileImage)
      .query(`
        INSERT INTO Users 
        (BAUST_ID, FullName, Email, PasswordHash, Role, Department, ProfileImage)
        VALUES 
        (@BAUST_ID, @FullName, @Email, @PasswordHash, @Role, @Department, @ProfileImage)
      `);

    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.send("Registration failed. Email or BAUST ID already exists.");
  }
};

exports.profilePage = async (req, res) => {
  const user = req.session.user;

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Profile - BAUST Bulletin</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>

<div class="app">
  <aside class="left-sidebar">
    <div class="logo-area">
      <div class="logo">🎓</div>
      <h2>BAUST Bulletin</h2>
    </div>

    <a class="nav" href="/posts/feed">🏠 Home</a>
    <a class="nav" href="/posts/search">🔍 Search</a>
    <a class="nav" href="/posts/notifications">🔔 Notifications</a>
    <a class="nav" href="/posts/announcements">📢 Announcements</a>
    <a class="logout" href="/logout">⏻ Logout</a>
  </aside>

  <main class="content">
    <header class="topbar">
      <div>
        <h1>My Profile</h1>
        <p>Update your account information</p>
      </div>
    </header>

    <div class="profile-page">
      <div class="profile-card-big">
        <img src="${user.ProfileImage || "/uploads/profiles/default.png"}">
        <h2>${user.FullName}</h2>
        <p>${user.Role} - ${user.Department}</p>
        <p>${user.Email}</p>
      </div>

      <form class="profile-form" method="POST" action="/profile/update" enctype="multipart/form-data">
        <h2>Edit Profile</h2>

        <label>Full Name</label>
        <input type="text" name="fullname" value="${user.FullName}" required>

        <label>Department</label>
        <input type="text" name="department" value="${user.Department}" required>

        <label>New Password</label>
        <input type="password" name="password" placeholder="Enter new password">

        <label>Change Profile Photo</label>
        <input type="file" name="profile" accept="image/*">

        <button type="submit">Update Profile</button>
      </form>
    </div>
  </main>
</div>

</body>
</html>
  `);
};

exports.updateProfile = async (req, res) => {
  try {
    const pool = await poolPromise;

    const { fullname, department, password } = req.body;
    const userID = req.session.user.UserID;

    const profileImage = req.file
      ? "/uploads/profiles/" + req.file.filename
      : req.session.user.ProfileImage;

    if (password && password.trim() !== "") {
      await pool
        .request()
        .input("UserID", sql.Int, userID)
        .input("FullName", sql.VarChar, fullname)
        .input("Department", sql.VarChar, department)
        .input("PasswordHash", sql.VarChar, password)
        .input("ProfileImage", sql.VarChar, profileImage)
        .query(`
          UPDATE Users
          SET FullName = @FullName,
              Department = @Department,
              PasswordHash = @PasswordHash,
              ProfileImage = @ProfileImage
          WHERE UserID = @UserID
        `);
    } else {
      await pool
        .request()
        .input("UserID", sql.Int, userID)
        .input("FullName", sql.VarChar, fullname)
        .input("Department", sql.VarChar, department)
        .input("ProfileImage", sql.VarChar, profileImage)
        .query(`
          UPDATE Users
          SET FullName = @FullName,
              Department = @Department,
              ProfileImage = @ProfileImage
          WHERE UserID = @UserID
        `);
    }

    const updatedUser = await pool
      .request()
      .input("UserID", sql.Int, userID)
      .query("SELECT * FROM Users WHERE UserID = @UserID");

    req.session.user = updatedUser.recordset[0];

    res.redirect("/profile");
  } catch (err) {
    console.log(err);
    res.send("Profile update failed");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};