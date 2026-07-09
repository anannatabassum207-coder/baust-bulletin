const sql = require("mssql/msnodesqlv8");

const config = {
  connectionString:
    "Driver={ODBC Driver 18 for SQL Server};Server=(local);Database=BAUST_Bulletin_DB;Trusted_Connection=Yes;TrustServerCertificate=Yes;"
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("MSSQL Database Connected Successfully");
    return pool;
  })
  .catch(err => {
    console.error("Database Connection Failed:", err);
  });

module.exports = { sql, poolPromise };