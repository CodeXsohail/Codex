// Mobile menu functionality
const menuIcon = document.querySelector('#menu-icon');
const navlist = document.querySelector('.navlist');
const body = document.body;

menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('active');
    navlist.classList.toggle('show');
    body.classList.toggle('menu-open');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navlist.contains(e.target) && !menuIcon.contains(e.target)) {
        menuIcon.classList.remove('active');
        navlist.classList.remove('show');
        body.classList.remove('menu-open');
    }
});

// Close menu when clicking a link
document.querySelectorAll('.navItem').forEach(link => {
    link.addEventListener('click', () => {
        menuIcon.classList.remove('active');
        navlist.classList.remove('show');
        body.classList.remove('menu-open');
    });
});

const inputs = document.querySelectorAll("input");
inputs.forEach((input) => {
  input.addEventListener("focus", () => {
    setTimeout(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  });
});


function toggleContent(id) {
    const content = document.getElementById(id);
    const header = content.previousElementSibling;
    
    if (content.classList.contains("visible")) {
        content.classList.remove("visible");
        header.classList.remove("active");
    } else {
        content.classList.add("visible");
        header.classList.add("active");
    }
}

// Add these utility functions
function showLoading(message = 'Processing...') {
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Add progress tracking
function updateProgress() {
    const totalQuestions = document.querySelectorAll('.question-card').length;
    const answeredQuestions = document.querySelectorAll('input[type="radio"]:checked').length;
    const progressBar = document.querySelector('.progress-bar-fill');
    const percentage = (answeredQuestions / totalQuestions) * 100;
    
    progressBar.style.width = `${percentage}%`;
    document.querySelector('.progress-text').textContent = 
        `${answeredQuestions} of ${totalQuestions} questions answered`;
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        tippy(element, {
            content: element.getAttribute('data-tooltip'),
            placement: 'top'
        });
    });
});

// Add this to your existing script.js
document.getElementById('previewBtn').addEventListener('click', function() {
    const modal = document.getElementById('previewModal');
    const modalBody = modal.querySelector('.modal-body');
    const answers = [];
    
    document.querySelectorAll('.question-card').forEach((card, index) => {
        const questionText = card.querySelector('.question-text').textContent;
        const selectedOption = card.querySelector('input[type="radio"]:checked');
        
        answers.push(`
            <div class="preview-question">
                <h4>Question ${index + 1}</h4>
                <p>${questionText}</p>
                <p class="selected-answer">
                    Your answer: ${selectedOption ? selectedOption.value : 'Not answered'}
                </p>
            </div>
        `);
    });
    
    modalBody.innerHTML = answers.join('<hr>');
    modal.style.display = 'block';
});

// Close modal functionality
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('previewModal').style.display = 'none';
});

// Navigation between questions
document.querySelector('.prev-btn').addEventListener('click', function() {
    navigateQuestions('prev');
});

document.querySelector('.next-btn').addEventListener('click', function() {
    navigateQuestions('next');
});

function navigateQuestions(direction) {
    const currentQuestion = document.querySelector('.question-card:not([style*="display: none"])');
    const questions = document.querySelectorAll('.question-card');
    const currentIndex = Array.from(questions).indexOf(currentQuestion);
    
    if (direction === 'next' && currentIndex < questions.length - 1) {
        currentQuestion.style.display = 'none';
        questions[currentIndex + 1].style.display = 'block';
    } else if (direction === 'prev' && currentIndex > 0) {
        currentQuestion.style.display = 'none';
        questions[currentIndex - 1].style.display = 'block';
    }
    
    updateQuestionDots(currentIndex + (direction === 'next' ? 1 : -1));
}

function updateQuestionDots(currentIndex) {
    document.querySelectorAll('.question-dot').forEach((dot, index) => {
        dot.classList.toggle('current', index === currentIndex);
    });
}
