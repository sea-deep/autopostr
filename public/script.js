document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    const loginButton = document.querySelector('.login');
    const dashButton = document.querySelector('.dashboard-link');


    const linksContainer = document.querySelector('.links');

    // Add links dynamically if user is logged in
    if (data.loggedIn) {
      dashButton.style.display = 'block';

      const dashboardLink = document.createElement('a');
      dashboardLink.className = 'link-item animate-link';
      dashboardLink.href = '/dashboard';
      dashboardLink.textContent = 'Dashboard';

      const logoutLink = document.createElement('a');
      logoutLink.className = 'link-item animate-link';
      logoutLink.href = '/auth/logout';
      logoutLink.textContent = 'Log out';

      linksContainer.appendChild(dashboardLink);
      linksContainer.appendChild(logoutLink);
    } else {
      loginButton.style.display = 'block';
    }
  } catch (error) {
    console.error('Error fetching auth status:', error);
  }
});

// Hamburger menu toggle
function toggleLinks() {
  const links = document.querySelector('.link-container .links');
  links.classList.toggle('show');
}
