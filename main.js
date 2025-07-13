/*
  main.js
  This script handles the global theme application and mobile navigation
  for the entire web application.
*/

// Self-invoking function to apply the theme as early as possible to avoid flashing.
(function() {
    // Retrieve the saved theme from localStorage.
    const savedTheme = localStorage.getItem('app-theme');

    // If a theme is found in localStorage, apply it to the <html> element.
    if (savedTheme) {
        // Clear any existing theme classes to ensure a clean slate.
        document.documentElement.className = ''; 
        
        // Add the new theme class (e.g., 'theme-dark', 'theme-paper').
        // If the saved theme is 'light', no class is needed as it's the default.
        if (savedTheme !== 'light') {
            document.documentElement.classList.add(`theme-${savedTheme}`);
        }
    }
})();

// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Functionality ---

    // Get the button and the menu elements from the DOM
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Check if both elements exist to prevent errors
    if (mobileMenuButton && mobileMenu) {
        // Add a click event listener to the hamburger button
        mobileMenuButton.addEventListener('click', () => {
            // Toggle the 'hidden' class on the menu to show/hide it
            mobileMenu.classList.toggle('hidden');
        });

        // --- Auto-hide Menu on Link Click ---
        // Get all clickable elements (links and buttons) inside the mobile menu
        const menuLinks = mobileMenu.querySelectorAll('a, button');

        // Loop through each clickable element
        menuLinks.forEach(link => {
            // Add a click event listener to each one
            link.addEventListener('click', () => {
                // Hide the menu. A small delay can sometimes help ensure
                // that the primary action (like navigation) happens before hiding.
                setTimeout(() => {
                    if (!mobileMenu.classList.contains('hidden')) {
                        mobileMenu.classList.add('hidden');
                    }
                }, 100);
            });
        });
    }
});
