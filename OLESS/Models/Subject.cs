using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class Subject
    {
        public int SubjectID { get; set; }
        public string SubjectCode { get; set; }
        public string SubjectName { get; set; }
        public string Description { get; set; }
        public int Credits { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class Topic
    {
        public int TopicID { get; set; }
        public int SubjectID { get; set; }
        public string TopicName { get; set; }
        public string Description { get; set; }
        public int Weightage { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SubjectRepository
    {
        private readonly DatabaseContext _db;

        public SubjectRepository(DatabaseContext db)
        {
            _db = db;
        }

        public Subject GetById(int subjectId)
        {
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT * FROM Subjects WHERE SubjectID = @SubjectID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapSubject(dt.Rows[0]);
            }
            return null;
        }

        public int Create(Subject subject)
        {
            var parameters = new[]
            {
                new SqlParameter("@SubjectCode", subject.SubjectCode),
                new SqlParameter("@SubjectName", subject.SubjectName),
                new SqlParameter("@Description", subject.Description ?? (object)DBNull.Value),
                new SqlParameter("@Credits", subject.Credits),
                new SqlParameter("@CreatedBy", subject.CreatedBy)
            };
            var result = _db.ExecuteScalar("INSERT INTO Subjects OUTPUT INSERTED.SubjectID VALUES (@SubjectCode, @SubjectName, @Description, @Credits, 1, @CreatedBy, GETDATE())", parameters);
            return Convert.ToInt32(result);
        }

        public bool Update(Subject subject)
        {
            var parameters = new[]
            {
                new SqlParameter("@SubjectID", subject.SubjectID),
                new SqlParameter("@SubjectCode", subject.SubjectCode),
                new SqlParameter("@SubjectName", subject.SubjectName),
                new SqlParameter("@Description", subject.Description ?? (object)DBNull.Value),
                new SqlParameter("@Credits", subject.Credits),
                new SqlParameter("@IsActive", subject.IsActive)
            };
            return _db.ExecuteNonQuery("UPDATE Subjects SET SubjectCode=@SubjectCode, SubjectName=@SubjectName, Description=@Description, Credits=@Credits, IsActive=@IsActive WHERE SubjectID=@SubjectID", parameters) > 0;
        }

        public bool Delete(int subjectId)
        {
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            return _db.ExecuteNonQuery("DELETE FROM Subjects WHERE SubjectID = @SubjectID", parameters) > 0;
        }

        public List<Subject> GetAll()
        {
            var subjects = new List<Subject>();
            var dt = _db.ExecuteReader("SELECT * FROM Subjects ORDER BY SubjectName");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                subjects.Add(MapSubject(row));
            }
            return subjects;
        }

        public List<Subject> GetActive()
        {
            var subjects = new List<Subject>();
            var dt = _db.ExecuteReader("SELECT * FROM Subjects WHERE IsActive = 1 ORDER BY SubjectName");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                subjects.Add(MapSubject(row));
            }
            return subjects;
        }

        private Subject MapSubject(System.Data.DataRow row)
        {
            return new Subject
            {
                SubjectID = Convert.ToInt32(row["SubjectID"]),
                SubjectCode = row["SubjectCode"].ToString(),
                SubjectName = row["SubjectName"].ToString(),
                Description = row["Description"] == DBNull.Value ? null : row["Description"].ToString(),
                Credits = Convert.ToInt32(row["Credits"]),
                IsActive = Convert.ToBoolean(row["IsActive"]),
                CreatedBy = Convert.ToInt32(row["CreatedBy"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"])
            };
        }
    }

    public class TopicRepository
    {
        private readonly DatabaseContext _db;

        public TopicRepository(DatabaseContext db)
        {
            _db = db;
        }

        public Topic GetById(int topicId)
        {
            var parameters = new[] { new SqlParameter("@TopicID", topicId) };
            var dt = _db.ExecuteReader("SELECT * FROM Topics WHERE TopicID = @TopicID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapTopic(dt.Rows[0]);
            }
            return null;
        }

        public int Create(Topic topic)
        {
            var parameters = new[]
            {
                new SqlParameter("@SubjectID", topic.SubjectID),
                new SqlParameter("@TopicName", topic.TopicName),
                new SqlParameter("@Description", topic.Description ?? (object)DBNull.Value),
                new SqlParameter("@Weightage", topic.Weightage)
            };
            var result = _db.ExecuteScalar("INSERT INTO Topics OUTPUT INSERTED.TopicID VALUES (@SubjectID, @TopicName, @Description, @Weightage, 1, GETDATE())", parameters);
            return Convert.ToInt32(result);
        }

        public bool Update(Topic topic)
        {
            var parameters = new[]
            {
                new SqlParameter("@TopicID", topic.TopicID),
                new SqlParameter("@TopicName", topic.TopicName),
                new SqlParameter("@Description", topic.Description ?? (object)DBNull.Value),
                new SqlParameter("@Weightage", topic.Weightage),
                new SqlParameter("@IsActive", topic.IsActive)
            };
            return _db.ExecuteNonQuery("UPDATE Topics SET TopicName=@TopicName, Description=@Description, Weightage=@Weightage, IsActive=@IsActive WHERE TopicID=@TopicID", parameters) > 0;
        }

        public bool Delete(int topicId)
        {
            var parameters = new[] { new SqlParameter("@TopicID", topicId) };
            return _db.ExecuteNonQuery("DELETE FROM Topics WHERE TopicID = @TopicID", parameters) > 0;
        }

        public List<Topic> GetBySubject(int subjectId)
        {
            var topics = new List<Topic>();
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT * FROM Topics WHERE SubjectID = @SubjectID ORDER BY TopicName", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                topics.Add(MapTopic(row));
            }
            return topics;
        }

        private Topic MapTopic(System.Data.DataRow row)
        {
            return new Topic
            {
                TopicID = Convert.ToInt32(row["TopicID"]),
                SubjectID = Convert.ToInt32(row["SubjectID"]),
                TopicName = row["TopicName"].ToString(),
                Description = row["Description"] == DBNull.Value ? null : row["Description"].ToString(),
                Weightage = Convert.ToInt32(row["Weightage"]),
                IsActive = Convert.ToBoolean(row["IsActive"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"])
            };
        }
    }
}
