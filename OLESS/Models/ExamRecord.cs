using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class ExamRecord
    {
        public int ExamID { get; set; }
        public int ExamineeID { get; set; }
        public int SubjectID { get; set; }
        public DateTime ExamDate { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int TotalQuestions { get; set; }
        public int AnsweredQuestions { get; set; }
        public string ExamStatus { get; set; }
        public string DifficultyLevel { get; set; }
        public int TimeLimit { get; set; }
        public string BrowserHash { get; set; }
        public string IPAddress { get; set; }
        public bool IsRandomized { get; set; }
        public DateTime CreatedAt { get; set; }

        public string SubjectName { get; set; }
        public string StudentName { get; set; }
        public string EnrollmentNo { get; set; }
    }

    public class ExamQuestion
    {
        public int ExamQuestionID { get; set; }
        public int ExamID { get; set; }
        public int QuestionID { get; set; }
        public int QuestionOrder { get; set; }
        public bool IsAnswered { get; set; }

        public Question Question { get; set; }
        public string SelectedAnswer { get; set; }
    }

    public class ExamRecordRepository
    {
        private readonly DatabaseContext _db;

        public ExamRecordRepository(DatabaseContext db)
        {
            _db = db;
        }

        public ExamRecord GetById(int examId)
        {
            var parameters = new[] { new SqlParameter("@ExamID", examId) };
            var dt = _db.ExecuteReader("SELECT e.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM ExamRecords e INNER JOIN Subjects s ON e.SubjectID = s.SubjectID INNER JOIN Examinee ex ON e.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE e.ExamID = @ExamID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapExamRecord(dt.Rows[0]);
            }
            return null;
        }

        public int Create(ExamRecord exam)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamineeID", exam.ExamineeID),
                new SqlParameter("@SubjectID", exam.SubjectID),
                new SqlParameter("@ExamDate", exam.ExamDate),
                new SqlParameter("@TotalQuestions", exam.TotalQuestions),
                new SqlParameter("@ExamStatus", exam.ExamStatus),
                new SqlParameter("@DifficultyLevel", exam.DifficultyLevel),
                new SqlParameter("@TimeLimit", exam.TimeLimit),
                new SqlParameter("@BrowserHash", exam.BrowserHash ?? (object)DBNull.Value),
                new SqlParameter("@IPAddress", exam.IPAddress ?? (object)DBNull.Value),
                new SqlParameter("@IsRandomized", exam.IsRandomized)
            };
            var result = _db.ExecuteScalar("INSERT INTO ExamRecords OUTPUT INSERTED.ExamID VALUES (@ExamineeID, @SubjectID, @ExamDate, NULL, NULL, @TotalQuestions, 0, @ExamStatus, @DifficultyLevel, @TimeLimit, @BrowserHash, @IPAddress, @IsRandomized, GETDATE())", parameters);
            return Convert.ToInt32(result);
        }

        public bool StartExam(int examId)
        {
            var parameters = new[] { new SqlParameter("@ExamID", examId) };
            return _db.ExecuteNonQuery("UPDATE ExamRecords SET ExamStatus = 'InProgress', StartTime = GETDATE() WHERE ExamID = @ExamID", parameters) > 0;
        }

        public bool EndExam(int examId, int answeredQuestions)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamID", examId),
                new SqlParameter("@AnsweredQuestions", answeredQuestions)
            };
            return _db.ExecuteNonQuery("UPDATE ExamRecords SET ExamStatus = 'Completed', EndTime = GETDATE(), AnsweredQuestions = @AnsweredQuestions WHERE ExamID = @ExamID", parameters) > 0;
        }

        public bool UpdateStatus(int examId, string status)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamID", examId),
                new SqlParameter("@Status", status)
            };
            return _db.ExecuteNonQuery("UPDATE ExamRecords SET ExamStatus = @Status WHERE ExamID = @ExamID", parameters) > 0;
        }

        public List<ExamRecord> GetByExaminee(int examineeId)
        {
            var exams = new List<ExamRecord>();
            var parameters = new[] { new SqlParameter("@ExamineeID", examineeId) };
            var dt = _db.ExecuteReader("SELECT e.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM ExamRecords e INNER JOIN Subjects s ON e.SubjectID = s.SubjectID INNER JOIN Examinee ex ON e.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE e.ExamineeID = @ExamineeID ORDER BY e.ExamDate DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                exams.Add(MapExamRecord(row));
            }
            return exams;
        }

        public List<ExamRecord> GetAll()
        {
            var exams = new List<ExamRecord>();
            var dt = _db.ExecuteReader("SELECT e.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM ExamRecords e INNER JOIN Subjects s ON e.SubjectID = s.SubjectID INNER JOIN Examinee ex ON e.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID ORDER BY e.ExamDate DESC");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                exams.Add(MapExamRecord(row));
            }
            return exams;
        }

        public ExamRecord GetActiveExam(int examineeId, int subjectId)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamineeID", examineeId),
                new SqlParameter("@SubjectID", subjectId)
            };
            var dt = _db.ExecuteReader("SELECT e.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM ExamRecords e INNER JOIN Subjects s ON e.SubjectID = s.SubjectID INNER JOIN Examinee ex ON e.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE e.ExamineeID = @ExamineeID AND e.SubjectID = @SubjectID AND e.ExamStatus = 'InProgress'", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapExamRecord(dt.Rows[0]);
            }
            return null;
        }

        private ExamRecord MapExamRecord(System.Data.DataRow row)
        {
            return new ExamRecord
            {
                ExamID = Convert.ToInt32(row["ExamID"]),
                ExamineeID = Convert.ToInt32(row["ExamineeID"]),
                SubjectID = Convert.ToInt32(row["SubjectID"]),
                ExamDate = Convert.ToDateTime(row["ExamDate"]),
                StartTime = row["StartTime"] == DBNull.Value ? null : Convert.ToDateTime(row["StartTime"]),
                EndTime = row["EndTime"] == DBNull.Value ? null : Convert.ToDateTime(row["EndTime"]),
                TotalQuestions = Convert.ToInt32(row["TotalQuestions"]),
                AnsweredQuestions = Convert.ToInt32(row["AnsweredQuestions"]),
                ExamStatus = row["ExamStatus"].ToString(),
                DifficultyLevel = row["DifficultyLevel"].ToString(),
                TimeLimit = Convert.ToInt32(row["TimeLimit"]),
                BrowserHash = row["BrowserHash"] == DBNull.Value ? null : row["BrowserHash"].ToString(),
                IPAddress = row["IPAddress"] == DBNull.Value ? null : row["IPAddress"].ToString(),
                IsRandomized = Convert.ToBoolean(row["IsRandomized"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"]),
                SubjectName = row["SubjectName"].ToString(),
                StudentName = row["StudentName"].ToString(),
                EnrollmentNo = row["EnrollmentNo"].ToString()
            };
        }
    }

    public class ExamQuestionRepository
    {
        private readonly DatabaseContext _db;

        public ExamQuestionRepository(DatabaseContext db)
        {
            _db = db;
        }

        public void CreateBatch(int examId, List<int> questionIds)
        {
            for (int i = 0; i < questionIds.Count; i++)
            {
                var parameters = new[]
                {
                    new SqlParameter("@ExamID", examId),
                    new SqlParameter("@QuestionID", questionIds[i]),
                    new SqlParameter("@QuestionOrder", i + 1)
                };
                _db.ExecuteNonQuery("INSERT INTO ExamQuestions (ExamID, QuestionID, QuestionOrder, IsAnswered) VALUES (@ExamID, @QuestionID, @QuestionOrder, 0)", parameters);
            }
        }

        public List<ExamQuestion> GetByExam(int examId)
        {
            var questions = new List<ExamQuestion>();
            var parameters = new[] { new SqlParameter("@ExamID", examId) };
            var dt = _db.ExecuteReader("SELECT eq.*, q.QuestionType, q.QuestionText, q.OptionA, q.OptionB, q.OptionC, q.OptionD, q.CorrectAnswer, q.DifficultyLevel, q.Marks FROM ExamQuestions eq INNER JOIN QuestionBank q ON eq.QuestionID = q.QuestionID WHERE eq.ExamID = @ExamID ORDER BY eq.QuestionOrder", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                var examQ = new ExamQuestion
                {
                    ExamQuestionID = Convert.ToInt32(row["ExamQuestionID"]),
                    ExamID = Convert.ToInt32(row["ExamID"]),
                    QuestionID = Convert.ToInt32(row["QuestionID"]),
                    QuestionOrder = Convert.ToInt32(row["QuestionOrder"]),
                    IsAnswered = Convert.ToBoolean(row["IsAnswered"]),
                    Question = new Question
                    {
                        QuestionID = Convert.ToInt32(row["QuestionID"]),
                        QuestionType = row["QuestionType"].ToString(),
                        QuestionText = row["QuestionText"].ToString(),
                        OptionA = row["OptionA"] == DBNull.Value ? null : row["OptionA"].ToString(),
                        OptionB = row["OptionB"] == DBNull.Value ? null : row["OptionB"].ToString(),
                        OptionC = row["OptionC"] == DBNull.Value ? null : row["OptionC"].ToString(),
                        OptionD = row["OptionD"] == DBNull.Value ? null : row["OptionD"].ToString(),
                        CorrectAnswer = row["CorrectAnswer"].ToString(),
                        DifficultyLevel = row["DifficultyLevel"].ToString(),
                        Marks = Convert.ToInt32(row["Marks"])
                    }
                };
                questions.Add(examQ);
            }
            return questions;
        }

        public bool MarkAnswered(int examQuestionId)
        {
            var parameters = new[] { new SqlParameter("@ExamQuestionID", examQuestionId) };
            return _db.ExecuteNonQuery("UPDATE ExamQuestions SET IsAnswered = 1 WHERE ExamQuestionID = @ExamQuestionID", parameters) > 0;
        }

        public int GetAnsweredCount(int examId)
        {
            var parameters = new[] { new SqlParameter("@ExamID", examId) };
            var result = _db.ExecuteScalar("SELECT COUNT(*) FROM ExamQuestions WHERE ExamID = @ExamID AND IsAnswered = 1", parameters);
            return Convert.ToInt32(result);
        }
    }
}
