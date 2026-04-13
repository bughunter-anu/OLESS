using System;
using System.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using OLESS.Models;
using BCrypt.Net;

namespace OLESS.Controllers
{
    public class AccountController : Controller
    {
        private readonly DatabaseContext _db;

        public AccountController(DatabaseContext db)
        {
            _db = db;
        }

        public IActionResult Login(string returnUrl = null)
        {
            ViewBag.ReturnUrl = returnUrl;
            return View();
        }

        [HttpPost]
        public IActionResult Login(string username, string password, string returnUrl = null)
        {
            try
            {
                var parameters = new[]
                {
                    new SqlParameter("@Username", username),
                    new SqlParameter("@Password", password)
                };
                var dt = _db.ExecuteReader("sp_AuthenticateUser", parameters);

                if (dt.Rows.Count > 0)
                {
                    var row = dt.Rows[0];
                    int status = Convert.ToInt32(row["Status"]);

                    if (status == 1)
                    {
                        int userId = Convert.ToInt32(row["UserID"]);
                        string role = row["Role"].ToString();

                        var userRepo = new UserRepository(_db);
                        var user = userRepo.GetById(userId);

                        HttpContext.Session.SetInt32("UserID", userId);
                        HttpContext.Session.SetString("Username", user.Username);
                        HttpContext.Session.SetString("Role", role);
                        HttpContext.Session.SetString("FullName", user.FullName);

                        if (role == "Student")
                        {
                            var examineeRepo = new ExamineeRepository(_db);
                            var examinee = examineeRepo.GetByUserId(userId);
                            if (examinee != null)
                            {
                                HttpContext.Session.SetInt32("ExamineeID", examinee.ExamineeID);
                            }
                        }

                        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                        {
                            return Redirect(returnUrl);
                        }

                        return RedirectToAction("Index", role == "Admin" ? "Admin" : role == "Student" ? "Student" : "Home");
                    }
                    else if (status == -2)
                    {
                        ViewBag.Error = "Account is locked. Try again later.";
                    }
                    else if (status == -3)
                    {
                        ViewBag.Error = "Account is deactivated.";
                    }
                    else if (status == -4)
                    {
                        ViewBag.Error = "Too many failed attempts. Account locked for 30 minutes.";
                    }
                    else
                    {
                        ViewBag.Error = "Invalid username or password.";
                    }
                }
                else
                {
                    ViewBag.Error = "Invalid username or password.";
                }
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Login failed: " + ex.Message;
            }

            ViewBag.Username = username;
            return View();
        }

        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Register(string username, string email, string password, string confirmPassword, string firstName, string lastName)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                ViewBag.Error = "All fields are required.";
                return View();
            }

            if (password != confirmPassword)
            {
                ViewBag.Error = "Passwords do not match.";
                return View();
            }

            if (password.Length < 6)
            {
                ViewBag.Error = "Password must be at least 6 characters.";
                return View();
            }

            try
            {
                var userRepo = new UserRepository(_db);

                var existingUser = userRepo.GetByUsername(username);
                if (existingUser != null)
                {
                    ViewBag.Error = "Username already exists.";
                    return View();
                }

                var user = new User
                {
                    Username = username,
                    PasswordHash = password,
                    Email = email,
                    Role = "Student",
                    FirstName = firstName,
                    LastName = lastName
                };

                int userId = userRepo.Create(user);

                var examineeRepo = new ExamineeRepository(_db);
                var examinee = new Examinee
                {
                    UserID = userId,
                    EnrollmentNo = "ENR" + DateTime.Now.ToString("yyyyMMdd") + userId.ToString().PadLeft(4, '0'),
                    DateOfBirth = DateTime.Now.AddYears(-18)
                };
                examineeRepo.Create(examinee);

                ViewBag.Success = "Registration successful! Please login.";
                return View("Login");
            }
            catch (Exception ex)
            {
                ViewBag.Error = "Registration failed: " + ex.Message;
            }

            return View();
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        public IActionResult AccessDenied()
        {
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
