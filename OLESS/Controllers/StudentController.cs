using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using OLESS.Models;

namespace OLESS.Controllers
{
    public class StudentController : Controller
    {
        private readonly DatabaseContext _db;

        public StudentController(DatabaseContext db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;
            var resultRepo = new ResultRepository(_db);
            var examRepo = new ExamRecordRepository(_db);

            ViewBag.RecentResults = resultRepo.GetByExaminee(examineeId);
            ViewBag.TotalExams = examRepo.GetByExaminee(examineeId).Count;
            ViewBag.PassedExams = resultRepo.GetByExaminee(examineeId).FindAll(r => r.PassStatus == "Pass").Count;

            return View();
        }

        public IActionResult Dashboard()
        {
            return Index();
        }

        public IActionResult Profile()
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int userId = HttpContext.Session.GetInt32("UserID") ?? 0;
            var userRepo = new UserRepository(_db);
            var examineeRepo = new ExamineeRepository(_db);

            var user = userRepo.GetById(userId);
            var examinee = examineeRepo.GetByUserId(userId);

            ViewBag.User = user;
            ViewBag.Examinee = examinee;

            return View();
        }

        [HttpPost]
        public IActionResult UpdateProfile(string firstName, string lastName, string email, string phone, string department, int? semester)
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                int userId = HttpContext.Session.GetInt32("UserID") ?? 0;
                var userRepo = new UserRepository(_db);
                var examineeRepo = new ExamineeRepository(_db);

                var user = userRepo.GetById(userId);
                user.FirstName = firstName;
                user.LastName = lastName;
                user.Email = email;
                userRepo.Update(user);

                var examinee = examineeRepo.GetByUserId(userId);
                if (examinee != null)
                {
                    examinee.Phone = phone;
                    examinee.Department = department;
                    examinee.Semester = semester;
                    examineeRepo.Update(examinee);
                }

                HttpContext.Session.SetString("FullName", $"{firstName} {lastName}");
                ViewBag.Success = "Profile updated successfully!";
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Update failed: " + ex.Message;
            }

            return Profile();
        }

        public IActionResult SelectExam()
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            var subjectRepo = new SubjectRepository(_db);
            ViewBag.Subjects = subjectRepo.GetActive();

            return View();
        }

        [HttpPost]
        public IActionResult StartExam(int subjectId, string difficultyLevel)
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;
            int userId = HttpContext.Session.GetInt32("UserID") ?? 0;

            var examRepo = new ExamRecordRepository(_db);
            var questionRepo = new QuestionRepository(_db);
            var examQuestionRepo = new ExamQuestionRepository(_db);

            var activeExam = examRepo.GetActiveExam(examineeId, subjectId);
            if (activeExam != null)
            {
                return RedirectToAction("ExamInterface", new { examId = activeExam.ExamID });
            }

            int questionCount = 10;
            var questions = questionRepo.GetRandomQuestions(subjectId, difficultyLevel, questionCount);

            if (questions.Count < questionCount)
            {
                questionCount = questions.Count;
            }

            if (questionCount == 0)
            {
                TempData["Error"] = "No questions available for this subject and difficulty level.";
                return RedirectToAction("SelectExam");
            }

            var exam = new ExamRecord
            {
                ExamineeID = examineeId,
                SubjectID = subjectId,
                ExamDate = DateTime.Now,
                TotalQuestions = questionCount,
                ExamStatus = "Scheduled",
                DifficultyLevel = difficultyLevel,
                TimeLimit = 30,
                IPAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                IsRandomized = true
            };

            int examId = examRepo.Create(exam);
            examQuestionRepo.CreateBatch(examId, questions.ConvertAll(q => q.QuestionID));
            examRepo.StartExam(examId);

            HttpContext.Session.SetInt32("CurrentExamID", examId);
            HttpContext.Session.SetString("ExamStartTime", DateTime.Now.ToString());

            return RedirectToAction("ExamInterface", new { examId });
        }

        public IActionResult ExamInterface(int examId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            var examRepo = new ExamRecordRepository(_db);
            var examQuestionRepo = new ExamQuestionRepository(_db);

            var exam = examRepo.GetById(examId);
            if (exam == null || exam.ExamineeID != (HttpContext.Session.GetInt32("ExamineeID") ?? 0))
            {
                return RedirectToAction("SelectExam");
            }

            if (exam.ExamStatus != "InProgress")
            {
                TempData["Error"] = "This exam is not active.";
                return RedirectToAction("Index");
            }

            var questions = examQuestionRepo.GetByExam(examId);

            var startTimeStr = HttpContext.Session.GetString("ExamStartTime");
            DateTime startTime = DateTime.Now;
            if (!string.IsNullOrEmpty(startTimeStr))
            {
                DateTime.TryParse(startTimeStr, out startTime);
            }
            else
            {
                startTime = exam.StartTime ?? DateTime.Now;
            }

            int elapsedSeconds = (int)(DateTime.Now - startTime).TotalSeconds;
            int remainingSeconds = (exam.TimeLimit * 60) - elapsedSeconds;

            if (remainingSeconds <= 0)
            {
                return RedirectToAction("SubmitExam", new { examId });
            }

            ViewBag.Exam = exam;
            ViewBag.Questions = questions;
            ViewBag.RemainingSeconds = remainingSeconds;
            ViewBag.CurrentQuestionIndex = 0;

            return View();
        }

        public IActionResult GetQuestion(int examId, int questionIndex)
        {
            if (!IsAuthenticated())
            {
                return Json(new { error = "Unauthorized" });
            }

            var examQuestionRepo = new ExamQuestionRepository(_db);
            var questions = examQuestionRepo.GetByExam(examId);

            if (questionIndex < 0 || questionIndex >= questions.Count)
            {
                return Json(new { error = "Invalid question index" });
            }

            var q = questions[questionIndex];
            return Json(new
            {
                index = questionIndex,
                total = questions.Count,
                questionId = q.QuestionID,
                examQuestionId = q.ExamQuestionID,
                type = q.Question.QuestionType,
                text = q.Question.QuestionText,
                optionA = q.Question.OptionA,
                optionB = q.Question.OptionB,
                optionC = q.Question.OptionC,
                optionD = q.Question.OptionD,
                isAnswered = q.IsAnswered
            });
        }

        [HttpPost]
        public IActionResult SaveAnswer(int examQuestionId, string answer)
        {
            if (!IsAuthenticated())
            {
                return Json(new { success = false, error = "Unauthorized" });
            }

            try
            {
                HttpContext.Session.SetString($"Answer_{examQuestionId}", answer ?? "");
                return Json(new { success = true });
            }
            catch
            {
                return Json(new { success = false });
            }
        }

        public IActionResult SubmitExam(int examId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;

            var examRepo = new ExamRecordRepository(_db);
            var examQuestionRepo = new ExamQuestionRepository(_db);
            var questionRepo = new QuestionRepository(_db);
            var resultRepo = new ResultRepository(_db);

            var exam = examRepo.GetById(examId);
            if (exam == null || exam.ExamineeID != examineeId)
            {
                return RedirectToAction("Index");
            }

            var examQuestions = examQuestionRepo.GetByExam(examId);
            int correctAnswers = 0;
            int totalQuestions = examQuestions.Count;

            foreach (var eq in examQuestions)
            {
                string selectedAnswer = HttpContext.Session.GetString($"Answer_{eq.ExamQuestionID}") ?? "";
                if (!string.IsNullOrEmpty(selectedAnswer))
                {
                    examQuestionRepo.MarkAnswered(eq.ExamQuestionID);
                    if (selectedAnswer == eq.Question.CorrectAnswer)
                    {
                        correctAnswers++;
                    }
                }
            }

            int answeredQuestions = examQuestionRepo.GetAnsweredCount(examId);
            examRepo.EndExam(examId, answeredQuestions);

            int wrongAnswers = answeredQuestions - correctAnswers;
            int unanswered = totalQuestions - answeredQuestions;
            decimal percentage = totalQuestions > 0 ? (correctAnswers * 100.0m) / totalQuestions : 0;
            string grade = GetGrade(percentage);
            string passStatus = percentage >= 50 ? "Pass" : "Fail";

            DateTime? startTime = exam.StartTime;
            int? timeTaken = startTime.HasValue ? (int)(DateTime.Now - startTime.Value).TotalMinutes : null;

            var result = new Result
            {
                ExamID = examId,
                ExamineeID = examineeId,
                SubjectID = exam.SubjectID,
                TotalQuestions = totalQuestions,
                CorrectAnswers = correctAnswers,
                WrongAnswers = wrongAnswers,
                Unanswered = unanswered,
                Score = correctAnswers,
                Percentage = Math.Round(percentage, 2),
                Grade = grade,
                PassStatus = passStatus,
                TimeTaken = timeTaken
            };

            resultRepo.Create(result);

            HttpContext.Session.Remove("CurrentExamID");
            HttpContext.Session.Remove("ExamStartTime");

            return RedirectToAction("ViewResult", "Student", new { examId });
        }

        public IActionResult ViewResult(int examId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;
            var resultRepo = new ResultRepository(_db);
            var result = resultRepo.GetByExam(examId);

            if (result == null || result.ExamineeID != examineeId)
            {
                return RedirectToAction("Index");
            }

            ViewBag.Result = result;
            return View();
        }

        public IActionResult MyResults()
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;
            var resultRepo = new ResultRepository(_db);

            ViewBag.Results = resultRepo.GetByExaminee(examineeId);
            return View();
        }

        public IActionResult MyExams()
        {
            if (!IsAuthenticated() || GetUserRole() != "Student")
            {
                return RedirectToAction("Login", "Account");
            }

            int examineeId = HttpContext.Session.GetInt32("ExamineeID") ?? 0;
            var examRepo = new ExamRecordRepository(_db);

            ViewBag.Exams = examRepo.GetByExaminee(examineeId);
            return View();
        }

        private string GetGrade(decimal percentage)
        {
            if (percentage >= 90) return "A+";
            if (percentage >= 80) return "A";
            if (percentage >= 70) return "B";
            if (percentage >= 60) return "C";
            if (percentage >= 50) return "D";
            return "F";
        }

        private bool IsAuthenticated()
        {
            return HttpContext.Session.GetInt32("UserID") != null;
        }

        private string GetUserRole()
        {
            return HttpContext.Session.GetString("Role") ?? "";
        }
    }
}
