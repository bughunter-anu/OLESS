using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class Examinee
    {
        public int ExamineeID { get; set; }
        public int UserID { get; set; }
        public string EnrollmentNo { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Department { get; set; }
        public int? Semester { get; set; }
        public string ProfileImage { get; set; }
        public bool IsRegistered { get; set; }
        public DateTime RegistrationDate { get; set; }

        public User User { get; set; }
    }

    public class ExamineeRepository
    {
        private readonly DatabaseContext _db;

        public ExamineeRepository(DatabaseContext db)
        {
            _db = db;
        }

        public Examinee GetById(int examineeId)
        {
            var parameters = new[] { new SqlParameter("@ExamineeID", examineeId) };
            var dt = _db.ExecuteReader("SELECT * FROM Examinee WHERE ExamineeID = @ExamineeID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapExaminee(dt.Rows[0]);
            }
            return null;
        }

        public Examinee GetByUserId(int userId)
        {
            var parameters = new[] { new SqlParameter("@UserID", userId) };
            var dt = _db.ExecuteReader("SELECT * FROM Examinee WHERE UserID = @UserID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapExaminee(dt.Rows[0]);
            }
            return null;
        }

        public int Create(Examinee examinee)
        {
            var parameters = new[]
            {
                new SqlParameter("@UserID", examinee.UserID),
                new SqlParameter("@EnrollmentNo", examinee.EnrollmentNo),
                new SqlParameter("@DateOfBirth", examinee.DateOfBirth),
                new SqlParameter("@Gender", examinee.Gender ?? (object)DBNull.Value),
                new SqlParameter("@Phone", examinee.Phone ?? (object)DBNull.Value),
                new SqlParameter("@Address", examinee.Address ?? (object)DBNull.Value),
                new SqlParameter("@Department", examinee.Department ?? (object)DBNull.Value),
                new SqlParameter("@Semester", examinee.Semester ?? (object)DBNull.Value)
            };
            var result = _db.ExecuteScalar("INSERT INTO Examinee OUTPUT INSERTED.ExamineeID VALUES (@UserID, @EnrollmentNo, @DateOfBirth, @Gender, @Phone, @Address, @Department, @Semester, NULL, 1, GETDATE())", parameters);
            return Convert.ToInt32(result);
        }

        public bool Update(Examinee examinee)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamineeID", examinee.ExamineeID),
                new SqlParameter("@DateOfBirth", examinee.DateOfBirth),
                new SqlParameter("@Gender", examinee.Gender ?? (object)DBNull.Value),
                new SqlParameter("@Phone", examinee.Phone ?? (object)DBNull.Value),
                new SqlParameter("@Address", examinee.Address ?? (object)DBNull.Value),
                new SqlParameter("@Department", examinee.Department ?? (object)DBNull.Value),
                new SqlParameter("@Semester", examinee.Semester ?? (object)DBNull.Value)
            };
            return _db.ExecuteNonQuery("UPDATE Examinee SET DateOfBirth=@DateOfBirth, Gender=@Gender, Phone=@Phone, Address=@Address, Department=@Department, Semester=@Semester WHERE ExamineeID=@ExamineeID", parameters) > 0;
        }

        public List<Examinee> GetAll()
        {
            var examinees = new List<Examinee>();
            var dt = _db.ExecuteReader("SELECT * FROM Examinee ORDER BY RegistrationDate DESC");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                examinees.Add(MapExaminee(row));
            }
            return examinees;
        }

        private Examinee MapExaminee(System.Data.DataRow row)
        {
            return new Examinee
            {
                ExamineeID = Convert.ToInt32(row["ExamineeID"]),
                UserID = Convert.ToInt32(row["UserID"]),
                EnrollmentNo = row["EnrollmentNo"].ToString(),
                DateOfBirth = Convert.ToDateTime(row["DateOfBirth"]),
                Gender = row["Gender"] == DBNull.Value ? null : row["Gender"].ToString(),
                Phone = row["Phone"] == DBNull.Value ? null : row["Phone"].ToString(),
                Address = row["Address"] == DBNull.Value ? null : row["Address"].ToString(),
                Department = row["Department"] == DBNull.Value ? null : row["Department"].ToString(),
                Semester = row["Semester"] == DBNull.Value ? null : Convert.ToInt32(row["Semester"]),
                ProfileImage = row["ProfileImage"] == DBNull.Value ? null : row["ProfileImage"].ToString(),
                IsRegistered = Convert.ToBoolean(row["IsRegistered"]),
                RegistrationDate = Convert.ToDateTime(row["RegistrationDate"])
            };
        }
    }
}
