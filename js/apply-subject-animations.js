document.addEventListener('DOMContentLoaded', function() {
    // Add page-load class to main content
    const main = document.querySelector('main');
    if (main) {
        main.classList.add('page-load');
    }

    // Add content-section class to main container if it doesn't have it
    const container = document.querySelector('.container:not(.content-section)');
    if (container) {
        container.classList.add('content-section');
    }

    // Add hover effects to all cards
    const cards = document.querySelectorAll('.subject-card, .feature-card, .card, .formula-card');
    cards.forEach(card => {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn, button, a[href*="#"], .dropdown-toggle');
    buttons.forEach(button => {
        button.style.transition = 'all 0.3s ease';
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
    });

    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add animation to subject cards in the grid
    const subjectCards = document.querySelectorAll('.subject-card');
    subjectCards.forEach((card, index) => {
        card.style.animation = `fadeIn 0.6s ease-out ${0.1 * index}s forwards`;
        card.style.opacity = '0';
    });
});
