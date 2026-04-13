using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using OLESS.Models;

namespace OLESS.Controllers
{
    public class OperatorController : Controller
    {
        private readonly DatabaseContext _db;

        public OperatorController(DatabaseContext db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            if (!IsAuthenticated() || GetUserRole() != "Operator")
            {
                return RedirectToAction("Login", "Account");
            }

            return View();
        }

        public IActionResult Dashboard()
        {
            return Index();
        }

        public IActionResult ManageExams()
        {
            if (!IsAuthenticated() || GetUserRole() != "Operator")
            {
                return RedirectToAction("Login", "Account");
            }

            var examRepo = new ExamRecordRepository(_db);
            var subjectRepo = new SubjectRepository(_db);

            ViewBag.Exams = examRepo.GetAll();
            ViewBag.Subjects = subjectRepo.GetActive();

            return View();
        }

        [HttpPost]
        public IActionResult ScheduleExam(int examineeId, int subjectId, string difficultyLevel, int timeLimit, DateTime examDate)
        {
            if (!IsAuthenticated() || GetUserRole() != "Operator")
            {
                return RedirectToAction("Login", "Account");
            }

            try
            {
                var examRepo = new ExamRecordRepository(_db);

                var exam = new ExamRecord
                {
                    ExamineeID = examineeId,
                    SubjectID = subjectId,
                    ExamDate = examDate,
                    TotalQuestions = 10,
                    ExamStatus = "Scheduled",
                    DifficultyLevel = difficultyLevel,
                    TimeLimit = timeLimit,
                    IsRandomized = true
                };

                examRepo.Create(exam);
                TempData["Success"] = "Exam scheduled successfully!";
            }
            catch (Exception ex)
            {
                TempData["Error"] = "Error scheduling exam: " + ex.Message;
            }

            return RedirectToAction("ManageExams");
        }

        public IActionResult ViewResults()
        {
            if (!IsAuthenticated() || GetUserRole() != "Operator")
            {
                return RedirectToAction("Login", "Account");
            }

            var resultRepo = new ResultRepository(_db);
            ViewBag.Results = resultRepo.GetAll();

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
