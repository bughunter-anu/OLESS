using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class User
    {
        public int UserID { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
        public int LoginAttempts { get; set; }
        public DateTime? LockedUntil { get; set; }

        public string FullName => $"{FirstName} {LastName}";
    }

    public class UserRepository
    {
        private readonly DatabaseContext _db;

        public UserRepository(DatabaseContext db)
        {
            _db = db;
        }

        public User GetById(int userId)
        {
            var parameters = new[] { new SqlParameter("@UserID", userId) };
            var dt = _db.ExecuteReader("SELECT * FROM Users WHERE UserID = @UserID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapUser(dt.Rows[0]);
            }
            return null;
        }

        public User GetByUsername(string username)
        {
            var parameters = new[] { new SqlParameter("@Username", username) };
            var dt = _db.ExecuteReader("SELECT * FROM Users WHERE Username = @Username", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapUser(dt.Rows[0]);
            }
            return null;
        }

        public int Create(User user)
        {
            var parameters = new[]
            {
                new SqlParameter("@Username", user.Username),
                new SqlParameter("@PasswordHash", user.PasswordHash),
                new SqlParameter("@Email", user.Email),
                new SqlParameter("@Role", user.Role),
                new SqlParameter("@FirstName", user.FirstName),
                new SqlParameter("@LastName", user.LastName)
            };
            var result = _db.ExecuteScalar("INSERT INTO Users OUTPUT INSERTED.UserID VALUES (@Username, @PasswordHash, @Email, @Role, @FirstName, @LastName, 1, GETDATE(), NULL, 0, NULL)", parameters);
            return Convert.ToInt32(result);
        }

        public bool Update(User user)
        {
            var parameters = new[]
            {
                new SqlParameter("@UserID", user.UserID),
                new SqlParameter("@Email", user.Email),
                new SqlParameter("@FirstName", user.FirstName),
                new SqlParameter("@LastName", user.LastName),
                new SqlParameter("@IsActive", user.IsActive)
            };
            return _db.ExecuteNonQuery("UPDATE Users SET Email=@Email, FirstName=@FirstName, LastName=@LastName, IsActive=@IsActive WHERE UserID=@UserID", parameters) > 0;
        }

        public bool ChangePassword(int userId, string newPasswordHash)
        {
            var parameters = new[]
            {
                new SqlParameter("@UserID", userId),
                new SqlParameter("@PasswordHash", newPasswordHash)
            };
            return _db.ExecuteNonQuery("UPDATE Users SET PasswordHash=@PasswordHash WHERE UserID=@UserID", parameters) > 0;
        }

        public List<User> GetAll()
        {
            var users = new List<User>();
            var dt = _db.ExecuteReader("SELECT * FROM Users ORDER BY CreatedAt DESC");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                users.Add(MapUser(row));
            }
            return users;
        }

        public List<User> GetByRole(string role)
        {
            var users = new List<User>();
            var parameters = new[] { new SqlParameter("@Role", role) };
            var dt = _db.ExecuteReader("SELECT * FROM Users WHERE Role = @Role ORDER BY CreatedAt DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                users.Add(MapUser(row));
            }
            return users;
        }

        private User MapUser(System.Data.DataRow row)
        {
            return new User
            {
                UserID = Convert.ToInt32(row["UserID"]),
                Username = row["Username"].ToString(),
                PasswordHash = row["PasswordHash"].ToString(),
                Email = row["Email"].ToString(),
                Role = row["Role"].ToString(),
                FirstName = row["FirstName"].ToString(),
                LastName = row["LastName"].ToString(),
                IsActive = Convert.ToBoolean(row["IsActive"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"]),
                LastLogin = row["LastLogin"] == DBNull.Value ? null : Convert.ToDateTime(row["LastLogin"]),
                LoginAttempts = Convert.ToInt32(row["LoginAttempts"]),
                LockedUntil = row["LockedUntil"] == DBNull.Value ? null : Convert.ToDateTime(row["LockedUntil"])
            };
        }
    }
}
