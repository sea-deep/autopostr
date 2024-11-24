document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();

    const loginButton = document.querySelector('.login');
    const logoutButton = document.querySelector('.logout-link');
    const dashButton = document.querySelector('.dashboard-link');
    if (data.loggedIn) {
      dashButton.style.display = 'block';
      logoutButton.style.display = 'block';
    } else {
      loginButton.style.display = 'block';
    }
  } catch (error) {
    console.error('Error fetching auth status:', error);
  }
});

