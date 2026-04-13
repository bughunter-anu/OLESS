using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using OLESS.Models;

namespace OLESS.Controllers
{
    public class AdminController : Controller
    {
        private readonly DatabaseContext _db;

        public AdminController(DatabaseContext db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var userRepo = new UserRepository(_db);
            var subjectRepo = new SubjectRepository(_db);
            var questionRepo = new QuestionRepository(_db);
            var examineeRepo = new ExamineeRepository(_db);
            var resultRepo = new ResultRepository(_db);

            ViewBag.TotalUsers = userRepo.GetAll().Count;
            ViewBag.TotalStudents = userRepo.GetByRole("Student").Count;
            ViewBag.TotalSubjects = subjectRepo.GetActive().Count;
            ViewBag.TotalQuestions = questionRepo.GetAll().Count;
            ViewBag.RecentResults = resultRepo.GetAll().GetRange(0, Math.Min(10, resultRepo.GetAll().Count));

            return View();
        }

        public IActionResult Dashboard()
        {
            return Index();
        }

        public IActionResult ManageUsers()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var userRepo = new UserRepository(_db);
            ViewBag.Users = userRepo.GetAll();
            ViewBag.Roles = new List<string> { "Admin", "Student", "Operator", "Controller" };

            return View();
        }

        [HttpPost]
        public IActionResult CreateUser(string username, string email, string password, string role, string firstName, string lastName)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var userRepo = new UserRepository(_db);

                if (userRepo.GetByUsername(username) != null)
                {
                    TempData["Error"] = "Username already exists.";
                    return RedirectToAction("ManageUsers");
                }

                var user = new User
                {
                    Username = username,
                    PasswordHash = password,
                    Email = email,
                    Role = role,
                    FirstName = firstName,
                    LastName = lastName
                };

                int userId = userRepo.Create(user);

                if (role == "Student")
                {
                    var examineeRepo = new ExamineeRepository(_db);
                    var examinee = new Examinee
                    {
                        UserID = userId,
                        EnrollmentNo = "ENR" + DateTime.Now.ToString("yyyyMMdd") + userId.ToString().PadLeft(4, '0'),
                        DateOfBirth = DateTime.Now.AddYears(-18)
                    };
                    examineeRepo.Create(examinee);
                }

                TempData["Success"] = "User created successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error creating user: " + ex.Message;
            }

            return RedirectToAction("ManageUsers");
        }

        [HttpPost]
        public IActionResult UpdateUser(int userId, string email, string firstName, string lastName, bool isActive)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var userRepo = new UserRepository(_db);
                var user = userRepo.GetById(userId);
                if (user != null)
                {
                    user.Email = email;
                    user.FirstName = firstName;
                    user.LastName = lastName;
                    user.IsActive = isActive;
                    userRepo.Update(user);
                    TempData["Success"] = "User updated successfully!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error updating user: " + ex.Message;
            }

            return RedirectToAction("ManageUsers");
        }

        [HttpPost]
        public IActionResult DeleteUser(int userId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            int currentUserId = HttpContext.Session.GetInt32("UserID") ?? 0;
            if (userId == currentUserId)
            {
                TempData["Error"] = "You cannot delete your own account.";
                return RedirectToAction("ManageUsers");
            }

            try
            {
                var parameters = new[] { new Microsoft.Data.SqlClient.SqlParameter("@UserID", userId) };
                _db.ExecuteNonQuery("UPDATE Users SET IsActive = 0 WHERE UserID = @UserID", parameters);
                TempData["Success"] = "User deactivated successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error deleting user: " + ex.Message;
            }

            return RedirectToAction("ManageUsers");
        }

        public IActionResult ManageSubjects()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var subjectRepo = new SubjectRepository(_db);
            ViewBag.Subjects = subjectRepo.GetAll();

            return View();
        }

        [HttpPost]
        public IActionResult CreateSubject(string subjectCode, string subjectName, string description, int credits)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                int userId = HttpContext.Session.GetInt32("UserID") ?? 0;
                var subjectRepo = new SubjectRepository(_db);

                var subject = new Subject
                {
                    SubjectCode = subjectCode,
                    SubjectName = subjectName,
                    Description = description,
                    Credits = credits,
                    CreatedBy = userId
                };

                subjectRepo.Create(subject);
                TempData["Success"] = "Subject created successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error creating subject: " + ex.Message;
            }

            return RedirectToAction("ManageSubjects");
        }

        [HttpPost]
        public IActionResult UpdateSubject(int subjectId, string subjectCode, string subjectName, string description, int credits, bool isActive)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var subjectRepo = new SubjectRepository(_db);
                var subject = subjectRepo.GetById(subjectId);
                if (subject != null)
                {
                    subject.SubjectCode = subjectCode;
                    subject.SubjectName = subjectName;
                    subject.Description = description;
                    subject.Credits = credits;
                    subject.IsActive = isActive;
                    subjectRepo.Update(subject);
                    TempData["Success"] = "Subject updated successfully!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error updating subject: " + ex.Message;
            }

            return RedirectToAction("ManageSubjects");
        }

        [HttpPost]
        public IActionResult DeleteSubject(int subjectId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var subjectRepo = new SubjectRepository(_db);
                subjectRepo.Delete(subjectId);
                TempData["Success"] = "Subject deleted successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error deleting subject: " + ex.Message;
            }

            return RedirectToAction("ManageSubjects");
        }

        public IActionResult ManageTopics()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var subjectRepo = new SubjectRepository(_db);
            var topicRepo = new TopicRepository(_db);

            ViewBag.Subjects = subjectRepo.GetActive();
            ViewBag.Topics = new List<Topic>();

            return View();
        }

        public IActionResult GetTopicsBySubject(int subjectId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return Json(new { error = "Unauthorized" });
            }

            var topicRepo = new TopicRepository(_db);
            var topics = topicRepo.GetBySubject(subjectId);
            return Json(topics);
        }

        [HttpPost]
        public IActionResult CreateTopic(int subjectId, string topicName, string description, int weightage)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var topicRepo = new TopicRepository(_db);

                var topic = new Topic
                {
                    SubjectID = subjectId,
                    TopicName = topicName,
                    Description = description,
                    Weightage = weightage
                };

                topicRepo.Create(topic);
                TempData["Success"] = "Topic created successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error creating topic: " + ex.Message;
            }

            return RedirectToAction("ManageTopics");
        }

        [HttpPost]
        public IActionResult UpdateTopic(int topicId, string topicName, string description, int weightage, bool isActive)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var topicRepo = new TopicRepository(_db);
                var topic = topicRepo.GetById(topicId);
                if (topic != null)
                {
                    topic.TopicName = topicName;
                    topic.Description = description;
                    topic.Weightage = weightage;
                    topic.IsActive = isActive;
                    topicRepo.Update(topic);
                    TempData["Success"] = "Topic updated successfully!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error updating topic: " + ex.Message;
            }

            return RedirectToAction("ManageTopics");
        }

        [HttpPost]
        public IActionResult DeleteTopic(int topicId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var topicRepo = new TopicRepository(_db);
                topicRepo.Delete(topicId);
                TempData["Success"] = "Topic deleted successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error deleting topic: " + ex.Message;
            }

            return RedirectToAction("ManageTopics");
        }

        public IActionResult ManageQuestions()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var subjectRepo = new SubjectRepository(_db);
            var topicRepo = new TopicRepository(_db);
            var questionRepo = new QuestionRepository(_db);

            ViewBag.Subjects = subjectRepo.GetActive();
            ViewBag.Topics = topicRepo.GetBySubject(1);
            ViewBag.Questions = questionRepo.GetAll();

            return View();
        }

        [HttpPost]
        public IActionResult CreateQuestion(int subjectId, int? topicId, string questionType, string questionText, string optionA, string optionB, string optionC, string optionD, string correctAnswer, string difficultyLevel, int marks, string explanation)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                int userId = HttpContext.Session.GetInt32("UserID") ?? 0;
                var questionRepo = new QuestionRepository(_db);

                var question = new Question
                {
                    SubjectID = subjectId,
                    TopicID = topicId,
                    QuestionType = questionType,
                    QuestionText = questionText,
                    OptionA = optionA,
                    OptionB = optionB,
                    OptionC = optionC,
                    OptionD = optionD,
                    CorrectAnswer = correctAnswer,
                    DifficultyLevel = difficultyLevel,
                    Marks = marks,
                    Explanation = explanation,
                    CreatedBy = userId
                };

                questionRepo.Create(question);
                TempData["Success"] = "Question created successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error creating question: " + ex.Message;
            }

            return RedirectToAction("ManageQuestions");
        }

        [HttpPost]
        public IActionResult UpdateQuestion(int questionId, int subjectId, int? topicId, string questionType, string questionText, string optionA, string optionB, string optionC, string optionD, string correctAnswer, string difficultyLevel, int marks, string explanation, bool isActive)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var questionRepo = new QuestionRepository(_db);
                var question = questionRepo.GetById(questionId);
                if (question != null)
                {
                    question.SubjectID = subjectId;
                    question.TopicID = topicId;
                    question.QuestionType = questionType;
                    question.QuestionText = questionText;
                    question.OptionA = optionA;
                    question.OptionB = optionB;
                    question.OptionC = optionC;
                    question.OptionD = optionD;
                    question.CorrectAnswer = correctAnswer;
                    question.DifficultyLevel = difficultyLevel;
                    question.Marks = marks;
                    question.Explanation = explanation;
                    question.IsActive = isActive;
                    questionRepo.Update(question);
                    TempData["Success"] = "Question updated successfully!";
                }
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error updating question: " + ex.Message;
            }

            return RedirectToAction("ManageQuestions");
        }

        [HttpPost]
        public IActionResult DeleteQuestion(int questionId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var questionRepo = new QuestionRepository(_db);
                questionRepo.Delete(questionId);
                TempData["Success"] = "Question deleted successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error deleting question: " + ex.Message;
            }

            return RedirectToAction("ManageQuestions");
        }

        public IActionResult ViewResults()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var resultRepo = new ResultRepository(_db);
            var subjectRepo = new SubjectRepository(_db);

            ViewBag.Results = resultRepo.GetAll();
            ViewBag.Subjects = subjectRepo.GetActive();

            return View();
        }

        public IActionResult GetSubjectResults(int subjectId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return Json(new { error = "Unauthorized" });
            }

            var resultRepo = new ResultRepository(_db);
            var results = resultRepo.GetBySubject(subjectId);
            return Json(results);
        }

        public IActionResult GetPassedStudents(int subjectId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return Json(new { error = "Unauthorized" });
            }

            var resultRepo = new ResultRepository(_db);
            var results = resultRepo.GetPassedStudents(subjectId);
            return Json(results);
        }

        public IActionResult GetFailedStudents(int subjectId)
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return Json(new { error = "Unauthorized" });
            }

            var resultRepo = new ResultRepository(_db);
            var results = resultRepo.GetFailedStudents(subjectId);
            return Json(results);
        }

        public IActionResult Reports()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var subjectRepo = new SubjectRepository(_db);
            var resultRepo = new ResultRepository(_db);

            ViewBag.Subjects = subjectRepo.GetActive();
            ViewBag.RecentResults = resultRepo.GetAll();

            return View();
        }

        public IActionResult ExamHistory()
        {
            if (!IsAuthenticated() || GetUserRole() != "Admin")
            {
                return RedirectToAction("Login", "Account");
            }

            var examRepo = new ExamRecordRepository(_db);
            ViewBag.Exams = examRepo.GetAll();

            return View();
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
