const { sql, poolPromise } = require("../config/db");

function profileImage(path) {
  return path || "/uploads/profiles/default.png";
}

function sidebar(active = "home") {
  return `
  <aside class="left-sidebar">
    <div class="logo-area">
      <div class="logo">🎓</div>
      <h2>BAUST Bulletin</h2>
    </div>

    <a class="nav ${active === "home" ? "active" : ""}" href="/posts/feed">🏠 Home</a>
    <a class="nav ${active === "search" ? "active" : ""}" href="/posts/search">🔍 Search</a>
    <a class="nav ${active === "notifications" ? "active" : ""}" href="/posts/notifications">🔔 Notifications <span class="badge">3</span></a>
    <a class="nav ${active === "announcements" ? "active" : ""}" href="/posts/announcements">📢 Announcements</a>

    <a class="logout" href="/logout">⏻ Logout</a>
  </aside>
  `;
}

function topbar(req, title, subtitle) {
  return `
  <header class="topbar">
    <div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>

    <a href="/profile" class="profile-mini">
      <img src="${profileImage(req.session.user.ProfileImage)}">
      <div>
        <b>${req.session.user.FullName}</b>
        <small>${req.session.user.Role}</small>
      </div>
    </a>
  </header>
  `;
}

exports.feed = async (req, res) => {
  try {
    const pool = await poolPromise;

    const posts = await pool.request().query(`
      SELECT 
        Posts.PostID,
        Posts.Content,
        Posts.ImagePath,
        Posts.CreatedAt,
        Users.FullName,
        Users.Role,
        Users.Department,
        Users.ProfileImage,
        Users.UserID,
        (SELECT COUNT(*) FROM Likes WHERE Likes.PostID = Posts.PostID) AS LikeCount,
        (SELECT COUNT(*) FROM Comments WHERE Comments.PostID = Posts.PostID) AS CommentCount
      FROM Posts
      INNER JOIN Users ON Posts.UserID = Users.UserID
      WHERE Posts.IsDeleted = 0
      ORDER BY Posts.CreatedAt DESC
    `);

    const comments = await pool.request().query(`
      SELECT 
        Comments.CommentID,
        Comments.PostID,
        Comments.CommentText,
        Comments.CreatedAt,
        Users.FullName,
        Users.ProfileImage
      FROM Comments
      INNER JOIN Users ON Comments.UserID = Users.UserID
      ORDER BY Comments.CreatedAt ASC
    `);

    const announcements = await pool.request().query(`
      SELECT TOP 5 * FROM Announcements ORDER BY CreatedAt DESC
    `);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>BAUST Bulletin</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>

<div class="app">
  ${sidebar("home")}

  <main class="content">
    ${topbar(req, "BAUST Bulletin", "University of Science and Technology")}

    <div class="main-grid">
      <section class="feed">

        <form class="create-post" method="POST" action="/posts/create" enctype="multipart/form-data">
          <div class="create-top">
            <img src="${profileImage(req.session.user.ProfileImage)}">
            <textarea name="content" placeholder="What's on your mind, ${req.session.user.FullName.split(" ")[0]}?" required></textarea>
          </div>

          <div class="create-bottom">
            <label class="file-btn">
              📷 Photo
              <input type="file" name="image" accept="image/*">
            </label>
            <button type="submit">Post</button>
          </div>
        </form>
    `;

    posts.recordset.forEach(post => {
      html += `
        <div class="post-card">
          <div class="post-header">
            <img src="${profileImage(post.ProfileImage)}">
            <div>
              <h3>${post.FullName}</h3>
              <small>${post.Role} - ${post.Department} • ${new Date(post.CreatedAt).toLocaleString()}</small>
            </div>
           ${
  post.UserID === req.session.user.UserID
    ? `
      <form method="POST" action="/posts/delete/${post.PostID}" class="delete-menu">
        <button type="submit" onclick="return confirm('Delete this post?')">••• Delete</button>
      </form>
    `
    : `<span class="dots">•••</span>`
}
          </div>

          <p class="post-text">${post.Content}</p>
      `;

      if (post.ImagePath) {
        html += `<img class="post-image" src="${post.ImagePath}">`;
      }

      html += `
          <div class="post-actions">
            <form method="POST" action="/posts/like/${post.PostID}">
              <button type="submit">👍 Like (${post.LikeCount})</button>
            </form>
            <button type="button">💬 ${post.CommentCount} Comment</button>
          </div>

          <form class="comment-form" method="POST" action="/posts/comment/${post.PostID}">
            <input type="text" name="comment" placeholder="Write comment..." required>
            <button type="submit">Comment</button>
          </form>

          <form class="report-form" method="POST" action="/posts/report/${post.PostID}">
            <input type="text" name="reason" placeholder="Report reason..." required>
            <button type="submit">Report</button>
          </form>

          <div class="comments">
      `;

      const postComments = comments.recordset.filter(c => Number(c.PostID) === Number(post.PostID));

if (postComments.length === 0) {
  html += `<p class="no-comment">No comments yet.</p>`;
}

postComments.forEach(c => {
  html += `
    <div class="comment">
      <img src="${profileImage(c.ProfileImage)}">
      <p><b>${c.FullName}</b><br>${c.CommentText}</p>
    </div>
  `;
});

      html += `
          </div>
        </div>
      `;
    });

    html += `
      </section>

      <aside class="right-sidebar">
        <div class="announcement-card">
          <div class="section-title">
            <h2>Announcements</h2>
            <a href="/posts/announcements">View All</a>
          </div>
    `;

    announcements.recordset.forEach(a => {
      html += `
        <div class="announcement">
          <span>📘</span>
          <div>
            <b>${a.Title}</b>
            <p>${a.Content}</p>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </aside>
    </div>
  </main>
</div>

</body>
</html>
`;

    res.send(html);
  } catch (err) {
    console.log(err);
    res.send("Feed loading error");
  }
};

exports.createPost = async (req, res) => {
  try {
    const pool = await poolPromise;

    const imagePath = req.file ? "/uploads/posts/" + req.file.filename : null;

    await pool
      .request()
      .input("UserID", sql.Int, req.session.user.UserID)
      .input("Content", sql.NVarChar(sql.MAX), req.body.content)
      .input("ImagePath", sql.VarChar(255), imagePath)
      .query(`
        INSERT INTO Posts (UserID, Content, ImagePath)
        VALUES (@UserID, @Content, @ImagePath)
      `);

    res.redirect("/posts/feed");
  } catch (err) {
    console.log("Post Create Error:", err);
    res.send("Post create error: " + err.message);
  }
};

exports.likePost = async (req, res) => {
  try {
    const pool = await poolPromise;

    const check = await pool
      .request()
      .input("PostID", sql.Int, req.params.id)
      .input("UserID", sql.Int, req.session.user.UserID)
      .query(`
        SELECT * FROM Likes 
        WHERE PostID = @PostID AND UserID = @UserID
      `);

    if (check.recordset.length > 0) {
      await pool
        .request()
        .input("PostID", sql.Int, req.params.id)
        .input("UserID", sql.Int, req.session.user.UserID)
        .query(`
          DELETE FROM Likes 
          WHERE PostID = @PostID AND UserID = @UserID
        `);
    } else {
      await pool
        .request()
        .input("PostID", sql.Int, req.params.id)
        .input("UserID", sql.Int, req.session.user.UserID)
        .query(`
          INSERT INTO Likes (PostID, UserID)
          VALUES (@PostID, @UserID)
        `);
    }

    res.redirect("/posts/feed");
  } catch (err) {
    console.log(err);
    res.redirect("/posts/feed");
  }
};

exports.commentPost = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("PostID", sql.Int, parseInt(req.params.id))
      .input("UserID", sql.Int, req.session.user.UserID)
      .input("CommentText", sql.NVarChar(sql.MAX), req.body.comment)
      .query(`
        INSERT INTO Comments (PostID, UserID, CommentText)
        VALUES (@PostID, @UserID, @CommentText)
      `);

    res.redirect("/posts/feed");
  } catch (err) {
    console.log("Comment Error:", err);
    res.send("Comment error: " + err.message);
  }
};

exports.reportPost = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("PostID", sql.Int, req.params.id)
      .input("UserID", sql.Int, req.session.user.UserID)
      .input("Reason", sql.VarChar, req.body.reason)
      .query(`
        INSERT INTO Reports (PostID, UserID, Reason)
        VALUES (@PostID, @UserID, @Reason)
      `);

    res.redirect("/posts/feed");
  } catch (err) {
    console.log(err);
    res.send("Report error");
  }
};

exports.searchPage = async (req, res) => {
  try {
    const pool = await poolPromise;
    const keyword = req.query.q || "";

    const result = await pool
      .request()
      .input("Keyword", sql.VarChar, `%${keyword}%`)
      .query(`
        SELECT 
          Posts.PostID,
          Posts.Content,
          Posts.ImagePath,
          Posts.CreatedAt,
          Users.FullName,
          Users.ProfileImage,
          Users.Department,
          Users.Role
        FROM Posts
        INNER JOIN Users ON Posts.UserID = Users.UserID
        WHERE Posts.IsDeleted = 0
        AND (
          Posts.Content LIKE @Keyword
          OR Users.FullName LIKE @Keyword
          OR Users.Department LIKE @Keyword
        )
        ORDER BY Posts.CreatedAt DESC
      `);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Search - BAUST Bulletin</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="app">
  ${sidebar("search")}

  <main class="content">
    ${topbar(req, "Search", "Find posts, users, and departments")}

    <div class="page-box">
      <form method="GET" action="/posts/search" class="search-box">
        <input type="text" name="q" value="${keyword}" placeholder="Search posts, users, department...">
        <button type="submit">Search</button>
      </form>

      <h2>Search Results</h2>
    `;

    if (result.recordset.length === 0) {
      html += `<p>No result found.</p>`;
    }

    result.recordset.forEach(post => {
      html += `
        <div class="post-card">
          <div class="post-header">
            <img src="${profileImage(post.ProfileImage)}">
            <div>
              <h3>${post.FullName}</h3>
              <small>${post.Role} - ${post.Department} • ${new Date(post.CreatedAt).toLocaleString()}</small>
            </div>
          </div>

          <p class="post-text">${post.Content}</p>
      `;

      if (post.ImagePath) {
        html += `<img class="post-image" src="${post.ImagePath}">`;
      }

      html += `</div>`;
    });

    html += `
    </div>
  </main>
</div>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.log(err);
    res.send("Search error");
  }
};

exports.notificationsPage = async (req, res) => {
  try {
    const pool = await poolPromise;

    const announcements = await pool.request().query(`
      SELECT TOP 5 * FROM Announcements ORDER BY CreatedAt DESC
    `);

    const comments = await pool
      .request()
      .input("UserID", sql.Int, req.session.user.UserID)
      .query(`
        SELECT TOP 10 
          Comments.CommentText, 
          Comments.CreatedAt, 
          Users.FullName
        FROM Comments
        INNER JOIN Posts ON Comments.PostID = Posts.PostID
        INNER JOIN Users ON Comments.UserID = Users.UserID
        WHERE Posts.UserID = @UserID
        ORDER BY Comments.CreatedAt DESC
      `);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Notifications - BAUST Bulletin</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="app">
  ${sidebar("notifications")}

  <main class="content">
    ${topbar(req, "Notifications", "Latest activity and updates")}

    <div class="page-box">
      <h2>Recent Notifications</h2>
    `;

    announcements.recordset.forEach(a => {
      html += `
        <div class="notification-item">
          <b>📢 ${a.Title}</b>
          <p>${a.Content}</p>
          <small>${new Date(a.CreatedAt).toLocaleString()}</small>
        </div>
      `;
    });

    comments.recordset.forEach(c => {
      html += `
        <div class="notification-item">
          <b>💬 ${c.FullName} commented on your post</b>
          <p>${c.CommentText}</p>
          <small>${new Date(c.CreatedAt).toLocaleString()}</small>
        </div>
      `;
    });

    html += `
    </div>
  </main>
</div>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.log(err);
    res.send("Notification error");
  }
};

exports.announcementsPage = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
        Announcements.*,
        Users.FullName
      FROM Announcements
      INNER JOIN Users ON Announcements.AdminID = Users.UserID
      ORDER BY Announcements.CreatedAt DESC
    `);

    let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Announcements - BAUST Bulletin</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
<div class="app">
  ${sidebar("announcements")}

  <main class="content">
    ${topbar(req, "Announcements", "Official campus updates")}

    <div class="page-box">
    `;

    if (result.recordset.length === 0) {
      html += `<p>No announcement found.</p>`;
    }

    result.recordset.forEach(a => {
      html += `
        <div class="announcement-full">
          <h2>📢 ${a.Title}</h2>
          <p>${a.Content}</p>
          <small>Posted by ${a.FullName} • ${new Date(a.CreatedAt).toLocaleString()}</small>
        </div>
      `;
    });

    html += `
    </div>
  </main>
</div>
</body>
</html>
    `;

    res.send(html);
  } catch (err) {
    console.log(err);
    res.send("Announcement page error: " + err.message);
  }
};
   
exports.deletePost = async (req, res) => {
  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("PostID", sql.Int, parseInt(req.params.id))
      .input("UserID", sql.Int, req.session.user.UserID)
      .query(`
        UPDATE Posts
        SET IsDeleted = 1
        WHERE PostID = @PostID AND UserID = @UserID
      `);

    res.redirect("/posts/feed");
  } catch (err) {
    console.log("Delete Post Error:", err);
    res.send("Delete post error: " + err.message);
  }
};