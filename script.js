// --- চূড়ান্ত এবং নির্ভরযোগ্য লোডার স্ক্রিপ্ট ---
const preloader = document.getElementById('preloader');
const loaderPercentage = document.getElementById('loader-percentage');
const progressBar = document.getElementById('progress-bar');

let progress = 0;
// একটি কৃত্রিম লোডিং ইফেক্ট, যা দ্রুত সম্পন্ন হবে
const interval = setInterval(() => {
    progress += Math.random() * 15; // দ্রুত বাড়ানোর জন্য মান পরিবর্তন
    if (progress > 100) {
        progress = 100;
    }
    loaderPercentage.textContent = `${Math.round(progress)}%`;
    progressBar.style.width = `${progress}%`;

    if (progress === 100) {
        clearInterval(interval);
    }
}, 100); // সময় কমানো হয়েছে

// window.onload নিশ্চিত করে যে ছবিসহ সকল কনটেন্ট লোড হয়েছে
window.onload = function() {
    clearInterval(interval);
    loaderPercentage.textContent = `100%`;
    progressBar.style.width = `100%`;

    // অল্প সময় পর লোডারটি fade out হবে
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500); 
    
    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
    });
};

// --- Mobile menu toggle script ---
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

const mobileMenuLinks = document.querySelectorAll('#mobile-menu a');
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
    });
});
