using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class Question
    {
        public int QuestionID { get; set; }
        public int SubjectID { get; set; }
        public int? TopicID { get; set; }
        public string QuestionType { get; set; }
        public string QuestionText { get; set; }
        public string OptionA { get; set; }
        public string OptionB { get; set; }
        public string OptionC { get; set; }
        public string OptionD { get; set; }
        public string CorrectAnswer { get; set; }
        public string DifficultyLevel { get; set; }
        public int Marks { get; set; }
        public string Explanation { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ModifiedAt { get; set; }

        public string TopicName { get; set; }
        public string SubjectName { get; set; }
    }

    public class QuestionRepository
    {
        private readonly DatabaseContext _db;

        public QuestionRepository(DatabaseContext db)
        {
            _db = db;
        }

        public Question GetById(int questionId)
        {
            var parameters = new[] { new SqlParameter("@QuestionID", questionId) };
            var dt = _db.ExecuteReader("SELECT q.*, t.TopicName, s.SubjectName FROM QuestionBank q LEFT JOIN Topics t ON q.TopicID = t.TopicID LEFT JOIN Subjects s ON q.SubjectID = s.SubjectID WHERE q.QuestionID = @QuestionID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapQuestion(dt.Rows[0]);
            }
            return null;
        }

        public int Create(Question question)
        {
            var parameters = new[]
            {
                new SqlParameter("@SubjectID", question.SubjectID),
                new SqlParameter("@TopicID", question.TopicID ?? (object)DBNull.Value),
                new SqlParameter("@QuestionType", question.QuestionType),
                new SqlParameter("@QuestionText", question.QuestionText),
                new SqlParameter("@OptionA", question.OptionA ?? (object)DBNull.Value),
                new SqlParameter("@OptionB", question.OptionB ?? (object)DBNull.Value),
                new SqlParameter("@OptionC", question.OptionC ?? (object)DBNull.Value),
                new SqlParameter("@OptionD", question.OptionD ?? (object)DBNull.Value),
                new SqlParameter("@CorrectAnswer", question.CorrectAnswer),
                new SqlParameter("@DifficultyLevel", question.DifficultyLevel),
                new SqlParameter("@Marks", question.Marks),
                new SqlParameter("@Explanation", question.Explanation ?? (object)DBNull.Value),
                new SqlParameter("@CreatedBy", question.CreatedBy)
            };
            var result = _db.ExecuteScalar("INSERT INTO QuestionBank OUTPUT INSERTED.QuestionID VALUES (@SubjectID, @TopicID, @QuestionType, @QuestionText, @OptionA, @OptionB, @OptionC, @OptionD, @CorrectAnswer, @DifficultyLevel, @Marks, @Explanation, 1, @CreatedBy, GETDATE(), NULL)", parameters);
            return Convert.ToInt32(result);
        }

        public bool Update(Question question)
        {
            var parameters = new[]
            {
                new SqlParameter("@QuestionID", question.QuestionID),
                new SqlParameter("@SubjectID", question.SubjectID),
                new SqlParameter("@TopicID", question.TopicID ?? (object)DBNull.Value),
                new SqlParameter("@QuestionType", question.QuestionType),
                new SqlParameter("@QuestionText", question.QuestionText),
                new SqlParameter("@OptionA", question.OptionA ?? (object)DBNull.Value),
                new SqlParameter("@OptionB", question.OptionB ?? (object)DBNull.Value),
                new SqlParameter("@OptionC", question.OptionC ?? (object)DBNull.Value),
                new SqlParameter("@OptionD", question.OptionD ?? (object)DBNull.Value),
                new SqlParameter("@CorrectAnswer", question.CorrectAnswer),
                new SqlParameter("@DifficultyLevel", question.DifficultyLevel),
                new SqlParameter("@Marks", question.Marks),
                new SqlParameter("@Explanation", question.Explanation ?? (object)DBNull.Value),
                new SqlParameter("@IsActive", question.IsActive)
            };
            return _db.ExecuteNonQuery("UPDATE QuestionBank SET SubjectID=@SubjectID, TopicID=@TopicID, QuestionType=@QuestionType, QuestionText=@QuestionText, OptionA=@OptionA, OptionB=@OptionB, OptionC=@OptionC, OptionD=@OptionD, CorrectAnswer=@CorrectAnswer, DifficultyLevel=@DifficultyLevel, Marks=@Marks, Explanation=@Explanation, IsActive=@IsActive, ModifiedAt=GETDATE() WHERE QuestionID=@QuestionID", parameters) > 0;
        }

        public bool Delete(int questionId)
        {
            var parameters = new[] { new SqlParameter("@QuestionID", questionId) };
            return _db.ExecuteNonQuery("DELETE FROM QuestionBank WHERE QuestionID = @QuestionID", parameters) > 0;
        }

        public List<Question> GetAll()
        {
            var questions = new List<Question>();
            var dt = _db.ExecuteReader("SELECT q.*, t.TopicName, s.SubjectName FROM QuestionBank q LEFT JOIN Topics t ON q.TopicID = t.TopicID LEFT JOIN Subjects s ON q.SubjectID = s.SubjectID ORDER BY q.CreatedAt DESC");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                questions.Add(MapQuestion(row));
            }
            return questions;
        }

        public List<Question> GetBySubject(int subjectId)
        {
            var questions = new List<Question>();
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT q.*, t.TopicName, s.SubjectName FROM QuestionBank q LEFT JOIN Topics t ON q.TopicID = t.TopicID LEFT JOIN Subjects s ON q.SubjectID = s.SubjectID WHERE q.SubjectID = @SubjectID ORDER BY q.QuestionID", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                questions.Add(MapQuestion(row));
            }
            return questions;
        }

        public List<Question> GetRandomQuestions(int subjectId, string difficultyLevel, int numberOfQuestions)
        {
            var questions = new List<Question>();
            var parameters = new[]
            {
                new SqlParameter("@SubjectID", subjectId),
                new SqlParameter("@DifficultyLevel", difficultyLevel),
                new SqlParameter("@NumberOfQuestions", numberOfQuestions)
            };
            var dt = _db.ExecuteReader("sp_GetRandomQuestions", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                questions.Add(MapQuestion(row));
            }
            return questions;
        }

        public int GetQuestionCount(int subjectId, string difficultyLevel)
        {
            var parameters = new[]
            {
                new SqlParameter("@SubjectID", subjectId),
                new SqlParameter("@DifficultyLevel", difficultyLevel)
            };
            var result = _db.ExecuteScalar("SELECT COUNT(*) FROM QuestionBank WHERE SubjectID = @SubjectID AND DifficultyLevel = @DifficultyLevel AND IsActive = 1", parameters);
            return Convert.ToInt32(result);
        }

        private Question MapQuestion(System.Data.DataRow row)
        {
            return new Question
            {
                QuestionID = Convert.ToInt32(row["QuestionID"]),
                SubjectID = Convert.ToInt32(row["SubjectID"]),
                TopicID = row["TopicID"] == DBNull.Value ? null : Convert.ToInt32(row["TopicID"]),
                QuestionType = row["QuestionType"].ToString(),
                QuestionText = row["QuestionText"].ToString(),
                OptionA = row["OptionA"] == DBNull.Value ? null : row["OptionA"].ToString(),
                OptionB = row["OptionB"] == DBNull.Value ? null : row["OptionB"].ToString(),
                OptionC = row["OptionC"] == DBNull.Value ? null : row["OptionC"].ToString(),
                OptionD = row["OptionD"] == DBNull.Value ? null : row["OptionD"].ToString(),
                CorrectAnswer = row["CorrectAnswer"].ToString(),
                DifficultyLevel = row["DifficultyLevel"].ToString(),
                Marks = Convert.ToInt32(row["Marks"]),
                Explanation = row["Explanation"] == DBNull.Value ? null : row["Explanation"].ToString(),
                IsActive = Convert.ToBoolean(row["IsActive"]),
                CreatedBy = Convert.ToInt32(row["CreatedBy"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"]),
                ModifiedAt = row["ModifiedAt"] == DBNull.Value ? null : Convert.ToDateTime(row["ModifiedAt"]),
                TopicName = row["TopicName"] == DBNull.Value ? null : row["TopicName"].ToString(),
                SubjectName = row["SubjectName"] == DBNull.Value ? null : row["SubjectName"].ToString()
            };
        }
    }
}
