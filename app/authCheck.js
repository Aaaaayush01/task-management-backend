const authToken = localStorage.getItem("token");

if (!authToken) {
  alert("Please login first");
  window.location.href = "../auth/login.html";
}