// Mobile navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.querySelector('.nav-overlay');
    const dropdownToggles = document.querySelectorAll('.dropdown > a');
    
    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
            
            // Toggle overlay
            if (navOverlay) {
                navOverlay.classList.toggle('active');
            }
        });
        
        // Close menu when clicking overlay
        if (navOverlay) {
            navOverlay.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
                this.classList.remove('active');
            });
        }
    }
    
    // Toggle dropdown on mobile
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) { // Only on mobile
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
                const content = this.nextElementSibling;
                content.classList.toggle('show');
            }
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            if (hamburger && navLinks.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
                if (navOverlay) navOverlay.classList.remove('active');
            }
        }
    });
    
    // Close menu when clicking a nav link, except for Exam Types
    const navAnchors = document.querySelectorAll('.nav-links a:not(.dropdown-toggle)');
    navAnchors.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('no-scroll');
                if (navOverlay) navOverlay.classList.remove('active');
            }
        });
    });
});
