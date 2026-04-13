using System;
using System.Collections.Generic;
using System.Data.SqlClient;

namespace OLESS.Models
{
    public class Result
    {
        public int ResultID { get; set; }
        public int ExamID { get; set; }
        public int ExamineeID { get; set; }
        public int SubjectID { get; set; }
        public int TotalQuestions { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int Unanswered { get; set; }
        public decimal Score { get; set; }
        public decimal Percentage { get; set; }
        public string Grade { get; set; }
        public string PassStatus { get; set; }
        public int? TimeTaken { get; set; }
        public string Strengths { get; set; }
        public string Weaknesses { get; set; }
        public int? Rank { get; set; }
        public decimal? Percentile { get; set; }
        public DateTime EvaluatedAt { get; set; }

        public string SubjectName { get; set; }
        public string StudentName { get; set; }
        public string EnrollmentNo { get; set; }
    }

    public class ResultRepository
    {
        private readonly DatabaseContext _db;

        public ResultRepository(DatabaseContext db)
        {
            _db = db;
        }

        public Result GetById(int resultId)
        {
            var parameters = new[] { new SqlParameter("@ResultID", resultId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.ResultID = @ResultID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapResult(dt.Rows[0]);
            }
            return null;
        }

        public Result GetByExam(int examId)
        {
            var parameters = new[] { new SqlParameter("@ExamID", examId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.ExamID = @ExamID", parameters);
            if (dt.Rows.Count > 0)
            {
                return MapResult(dt.Rows[0]);
            }
            return null;
        }

        public int Create(Result result)
        {
            var parameters = new[]
            {
                new SqlParameter("@ExamID", result.ExamID),
                new SqlParameter("@ExamineeID", result.ExamineeID),
                new SqlParameter("@SubjectID", result.SubjectID),
                new SqlParameter("@TotalQuestions", result.TotalQuestions),
                new SqlParameter("@CorrectAnswers", result.CorrectAnswers),
                new SqlParameter("@WrongAnswers", result.WrongAnswers),
                new SqlParameter("@Unanswered", result.Unanswered),
                new SqlParameter("@Score", result.Score),
                new SqlParameter("@Percentage", result.Percentage),
                new SqlParameter("@Grade", result.Grade),
                new SqlParameter("@PassStatus", result.PassStatus),
                new SqlParameter("@TimeTaken", result.TimeTaken ?? (object)DBNull.Value),
                new SqlParameter("@Strengths", result.Strengths ?? (object)DBNull.Value),
                new SqlParameter("@Weaknesses", result.Weaknesses ?? (object)DBNull.Value)
            };
            var id = _db.ExecuteScalar("INSERT INTO Results OUTPUT INSERTED.ResultID VALUES (@ExamID, @ExamineeID, @SubjectID, @TotalQuestions, @CorrectAnswers, @WrongAnswers, @Unanswered, @Score, @Percentage, @Grade, @PassStatus, @TimeTaken, @Strengths, @Weaknesses, NULL, NULL, GETDATE())", parameters);
            return Convert.ToInt32(id);
        }

        public List<Result> GetByExaminee(int examineeId)
        {
            var results = new List<Result>();
            var parameters = new[] { new SqlParameter("@ExamineeID", examineeId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.ExamineeID = @ExamineeID ORDER BY r.EvaluatedAt DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                results.Add(MapResult(row));
            }
            return results;
        }

        public List<Result> GetAll()
        {
            var results = new List<Result>();
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID ORDER BY r.EvaluatedAt DESC");
            foreach (System.Data.DataRow row in dt.Rows)
            {
                results.Add(MapResult(row));
            }
            return results;
        }

        public List<Result> GetBySubject(int subjectId)
        {
            var results = new List<Result>();
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.SubjectID = @SubjectID ORDER BY r.Percentage DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                results.Add(MapResult(row));
            }
            return results;
        }

        public List<Result> GetPassedStudents(int subjectId)
        {
            var results = new List<Result>();
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.SubjectID = @SubjectID AND r.PassStatus = 'Pass' ORDER BY r.Percentage DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                results.Add(MapResult(row));
            }
            return results;
        }

        public List<Result> GetFailedStudents(int subjectId)
        {
            var results = new List<Result>();
            var parameters = new[] { new SqlParameter("@SubjectID", subjectId) };
            var dt = _db.ExecuteReader("SELECT r.*, s.SubjectName, u.FirstName + ' ' + u.LastName AS StudentName, ex.EnrollmentNo FROM Results r INNER JOIN Subjects s ON r.SubjectID = s.SubjectID INNER JOIN Examinee ex ON r.ExamineeID = ex.ExamineeID INNER JOIN Users u ON ex.UserID = u.UserID WHERE r.SubjectID = @SubjectID AND r.PassStatus = 'Fail' ORDER BY r.Percentage DESC", parameters);
            foreach (System.Data.DataRow row in dt.Rows)
            {
                results.Add(MapResult(row));
            }
            return results;
        }

        public Result GetSubjectWiseAnalysis(int examineeId)
        {
            var parameters = new[] { new SqlParameter("@ExamineeID", examineeId) };
            var dt = _db.ExecuteReader("SELECT SubjectID, AVG(Percentage) as AvgPercentage, SUM(CorrectAnswers) as TotalCorrect, SUM(TotalQuestions) as TotalQuestions FROM Results WHERE ExamineeID = @ExamineeID GROUP BY SubjectID", parameters);
            if (dt.Rows.Count > 0)
            {
                var row = dt.Rows[0];
                return new Result
                {
                    ExamineeID = examineeId,
                    SubjectID = Convert.ToInt32(row["SubjectID"]),
                    Percentage = Convert.ToDecimal(row["AvgPercentage"]),
                    CorrectAnswers = Convert.ToInt32(row["TotalCorrect"]),
                    TotalQuestions = Convert.ToInt32(row["TotalQuestions"])
                };
            }
            return null;
        }

        private Result MapResult(System.Data.DataRow row)
        {
            return new Result
            {
                ResultID = Convert.ToInt32(row["ResultID"]),
                ExamID = Convert.ToInt32(row["ExamID"]),
                ExamineeID = Convert.ToInt32(row["ExamineeID"]),
                SubjectID = Convert.ToInt32(row["SubjectID"]),
                TotalQuestions = Convert.ToInt32(row["TotalQuestions"]),
                CorrectAnswers = Convert.ToInt32(row["CorrectAnswers"]),
                WrongAnswers = Convert.ToInt32(row["WrongAnswers"]),
                Unanswered = Convert.ToInt32(row["Unanswered"]),
                Score = Convert.ToDecimal(row["Score"]),
                Percentage = Convert.ToDecimal(row["Percentage"]),
                Grade = row["Grade"].ToString(),
                PassStatus = row["PassStatus"].ToString(),
                TimeTaken = row["TimeTaken"] == DBNull.Value ? null : Convert.ToInt32(row["TimeTaken"]),
                Strengths = row["Strengths"] == DBNull.Value ? null : row["Strengths"].ToString(),
                Weaknesses = row["Weaknesses"] == DBNull.Value ? null : row["Weaknesses"].ToString(),
                Rank = row["Rank"] == DBNull.Value ? null : Convert.ToInt32(row["Rank"]),
                Percentile = row["Percentile"] == DBNull.Value ? null : Convert.ToDecimal(row["Percentile"]),
                EvaluatedAt = Convert.ToDateTime(row["EvaluatedAt"]),
                SubjectName = row["SubjectName"].ToString(),
                StudentName = row["StudentName"].ToString(),
                EnrollmentNo = row["EnrollmentNo"].ToString()
            };
        }
    }
}
