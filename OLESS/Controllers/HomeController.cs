using System;
using System.Collections.Generic;
using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using OLESS.Models;

namespace OLESS.Controllers
{
    public class HomeController : Controller
    {
        private readonly DatabaseContext _db;

        public HomeController(DatabaseContext db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            var subjectRepo = new SubjectRepository(_db);
            var questionRepo = new QuestionRepository(_db);
            var examineeRepo = new ExamineeRepository(_db);

            ViewBag.SubjectCount = subjectRepo.GetActive().Count;
            ViewBag.QuestionCount = questionRepo.GetAll().Count;
            ViewBag.StudentCount = examineeRepo.GetAll().Count;

            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult Contact()
        {
            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }

    public class ErrorViewModel
    {
        public string RequestId { get; set; }
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}
