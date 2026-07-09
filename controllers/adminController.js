const { sql, poolPromise } = require("../config/db");

exports.dashboard = async (req, res) => {
  try {
    const pool = await poolPromise;

    const users = await pool.request().query("SELECT * FROM Users ORDER BY UserID DESC");

    const posts = await pool.request().query(`
      SELECT Posts.PostID, Posts.Content, Posts.CreatedAt, Users.FullName
      FROM Posts
      INNER JOIN Users ON Posts.UserID = Users.UserID
      WHERE Posts.IsDeleted = 0
      ORDER BY Posts.CreatedAt DESC
    `);

    const reports = await pool.request().query(`
      SELECT Reports.ReportID, Reports.Reason, Reports.Status, Reports.ReportedAt,
             Posts.Content, Users.FullName
      FROM Reports
      INNER JOIN Posts ON Reports.PostID = Posts.PostID
      INNER JOIN Users ON Reports.UserID = Users.UserID
      ORDER BY Reports.ReportedAt DESC
    `);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>

<div class="app">
  <aside class="left-sidebar">
    <div class="logo-area">
      <div class="logo">🛡️</div>
      <h2>Admin Panel</h2>
    </div>

    <a class="nav active" href="/admin/dashboard">Dashboard</a>
    <a class="nav" href="/posts/feed">User Feed</a>
    <a class="logout" href="/logout">Logout</a>
  </aside>

  <main class="content">
    <header class="topbar">
      <div>
        <h1>Admin Dashboard</h1>
        <p>Manage BAUST Bulletin</p>
      </div>
    </header>

    <div class="admin-stats">
      <div>Total Users<br><b>${users.recordset.length}</b></div>
      <div>Total Posts<br><b>${posts.recordset.length}</b></div>
      <div>Total Reports<br><b>${reports.recordset.length}</b></div>
    </div>

    <section class="create-post">
      <h2>Create Announcement</h2>

      <form method="POST" action="/admin/announcement">
        <input type="text" name="title" placeholder="Announcement Title" required>
        <textarea name="content" placeholder="Announcement Content" required></textarea>
        <button type="submit">Publish</button>
      </form>
    </section>

    <section class="admin-table">
      <h2>Users</h2>
      <table>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Blocked</th>
          <th>Action</th>
        </tr>
`;

    users.recordset.forEach(user => {
      html += `
        <tr>
          <td>${user.UserID}</td>
          <td>${user.FullName}</td>
          <td>${user.Email}</td>
          <td>${user.Role}</td>
          <td>${user.IsBlocked}</td>
          <td><a href="/admin/block-user/${user.UserID}">Block</a></td>
        </tr>
      `;
    });

    html += `
      </table>
    </section>

    <section>
      <h2>Posts</h2>
`;

    posts.recordset.forEach(post => {
      html += `
        <div class="post-card">
          <h3>${post.FullName}</h3>
          <p>${post.Content}</p>
          <a class="danger-link" href="/admin/delete-post/${post.PostID}">Delete Post</a>
        </div>
      `;
    });

    html += `
    </section>

    <section>
      <h2>Reports</h2>
`;

    reports.recordset.forEach(report => {
      html += `
        <div class="post-card">
          <p><b>Reported By:</b> ${report.FullName}</p>
          <p><b>Reason:</b> ${report.Reason}</p>
          <p><b>Post:</b> ${report.Content}</p>
          <p><b>Status:</b> ${report.Status}</p>
        </div>
      `;
    });

    html += `
    </section>
  </main>
</div>

</body>
</html>
`;

    res.send(html);
  } catch (err) {
    console.log("Admin Dashboard Error:", err);
    res.send("Admin dashboard error: " + err.message);
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("AdminID", sql.Int, req.session.user.UserID)
      .input("Title", sql.NVarChar(150), req.body.title)
      .input("Content", sql.NVarChar(sql.MAX), req.body.content)
      .query(`
        INSERT INTO Announcements (AdminID, Title, Content)
        VALUES (@AdminID, @Title, @Content)
      `);

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.log("Announcement Error:", err);
    res.send("Announcement error: " + err.message);
  }
};

exports.adminDeletePost = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("PostID", sql.Int, parseInt(req.params.id))
      .query("UPDATE Posts SET IsDeleted = 1 WHERE PostID = @PostID");

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.log("Admin Delete Error:", err);
    res.send("Delete error: " + err.message);
  }
};

exports.blockUser = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("UserID", sql.Int, parseInt(req.params.id))
      .query("UPDATE Users SET IsBlocked = 1 WHERE UserID = @UserID");

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.log("Block User Error:", err);
    res.send("Block user error: " + err.message);
  }
};