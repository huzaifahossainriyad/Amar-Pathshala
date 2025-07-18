document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // This needs to be configured with your project's URL and anon key
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- DOM Elements ---
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const tabSlider = document.getElementById('tab-slider');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-icon-sun');
    const moonIcon = document.getElementById('theme-icon-moon');
    const passwordToggles = document.querySelectorAll('.password-toggle');
    const signupPasswordInput = document.getElementById('signup-password');
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const allForms = document.querySelectorAll('form');
    const quoteContainer = document.getElementById('quote-container');
    const quoteTextElem = document.getElementById('quote-text');
    const quoteAuthorElem = document.getElementById('quote-author');
    const newQuoteBtn = document.getElementById('new-quote-btn');

    // --- Quotes Feature ---
    const quotes = [
        { quote: "আপনার জ্ঞানের ডিজিটাল সংগ্রহশালা। প্রতিটি বই হোক এক একটি নতুন পৃথিবী।", author: "আমার পাঠশালা" },
        { quote: "বই কিনে কেউ দেউলিয়া হয় না।", author: "সৈয়দ মুজতবা আলী" },
        { quote: "একটি ভালো বই একশ জন বন্ধুর সমান, কিন্তু একজন ভালো বন্ধু একটি লাইব্রেরির সমান।", author: "এপিজে আবদুল কালাম" },
        { quote: "বই পড়া মানে নিজের আত্মার সাথে কথা বলা।", author: "ভলতেয়ার" },
        { quote: "এমনভাবে পড়ো যেন তুমি চিরকাল বাঁচবে। এমনভাবে বাঁচো যেন তুমি আগামীকাল মারা যাবে।", author: "মহাত্মা গান্ধী" },
        { quote: "জ্ঞান হলো ডানা যা দিয়ে আমরা স্বর্গে উড়তে পারি।", author: "উইলিয়াম শেক্সপিয়ার" }
    ];

    let currentQuoteIndex = -1; // Start at -1 to show the first quote initially

    const showNewQuote = () => {
        if (!quoteContainer) return; // Don't run if the element doesn't exist
        
        quoteContainer.classList.add('fade-out');
        
        setTimeout(() => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            const { quote, author } = quotes[currentQuoteIndex];
            quoteTextElem.textContent = `"${quote}"`;
            quoteAuthorElem.textContent = `- ${author}`;
            quoteContainer.classList.remove('fade-out');
        }, 500); // Match CSS transition time
    };
    
    // Initial and periodic quote change
    showNewQuote(); 
    setInterval(showNewQuote, 10000); // Change quote every 10 seconds
    if(newQuoteBtn) {
        newQuoteBtn.addEventListener('click', showNewQuote);
    }


    // --- Theme Toggle Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            if(sunIcon) sunIcon.classList.add('hidden');
            if(moonIcon) moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            if(sunIcon) sunIcon.classList.remove('hidden');
            if(moonIcon) moonIcon.classList.add('hidden');
        }
    };
    const currentTheme = localStorage.getItem('theme') || 'light';
    applyTheme(currentTheme);
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    // --- Tab Switching Logic ---
    const updateSlider = (tab) => {
        if (!tabSlider || !tab) return;
        tabSlider.style.width = `${tab.offsetWidth}px`;
        tabSlider.style.left = `${tab.offsetLeft}px`;
    };
    const setActiveTab = (tab) => {
        if (!loginTab || !signupTab || !loginForm || !signupForm) return;
        const isLoginTab = tab === loginTab;
        loginTab.classList.toggle('text-[var(--text-secondary)]', !isLoginTab);
        loginTab.classList.toggle('text-[var(--text-primary)]', isLoginTab);
        signupTab.classList.toggle('text-[var(--text-secondary)]', isLoginTab);
        signupTab.classList.toggle('text-[var(--text-primary)]', !isLoginTab);
        loginForm.classList.toggle('hidden', !isLoginTab);
        signupForm.classList.toggle('hidden', isLoginTab);
        updateSlider(tab);
    };
    if (loginTab) loginTab.addEventListener('click', () => setActiveTab(loginTab));
    if (signupTab) signupTab.addEventListener('click', () => setActiveTab(signupTab));
    setTimeout(() => {
        if(loginTab) updateSlider(loginTab)
    }, 100);

    // --- Password Visibility Toggle ---
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.closest('.relative').querySelector('input');
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            toggle.querySelector('.eye-open').classList.toggle('hidden', isPassword);
            toggle.querySelector('.eye-closed').classList.toggle('hidden', !isPassword);
        });
    });
    
    // --- Form Validation Logic ---
    const validators = {
        'signup-name': (val) => val.length >= 3 ? '' : 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে।',
        'login-email': (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'সঠিক ইমেইল ঠিকানা লিখুন।',
        'signup-email': (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'সঠিক ইমেইল ঠিকানা লিখুন।',
        'login-password': (val) => val.length >= 6 ? '' : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
        'signup-password': (val) => {
            if (val.length < 8) return 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।';
            if (!/[A-Z]/.test(val)) return 'একটি বড় হাতের অক্ষর (A-Z) থাকতে হবে।';
            if (!/[a-z]/.test(val)) return 'একটি ছোট হাতের অক্ষর (a-z) থাকতে হবে।';
            if (!/[0-9]/.test(val)) return 'একটি সংখ্যা (0-9) থাকতে হবে।';
            return '';
        },
        'confirm-password': (val) => val === signupPasswordInput.value ? '' : 'পাসওয়ার্ড দুটি মেলেনি।'
    };

    const checkPasswordStrength = (password) => {
        if (!strengthBar || !strengthText) return;
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        strengthBar.className = 'password-strength-bar';
        if (score <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'দুর্বল';
        } else if (score <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'মাঝারি';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'শক্তিশালী';
        }
    };
    
    const validateField = (input) => {
        if (!input) return;
        const validator = validators[input.name];
        if (!validator) return;
        const errorMessage = validator(input.value);
        const errorElement = input.closest('.floating-label-group').querySelector('.error-message');
        if (errorElement) errorElement.textContent = errorMessage;
        
        if (input.name === 'signup-password') {
            checkPasswordStrength(input.value);
            if (confirmPasswordInput) validateField(confirmPasswordInput);
        }
        if (input.form) checkFormValidity(input.form);
    };

    const checkFormValidity = (form) => {
        if (!form) return;
        const inputs = form.querySelectorAll('input[required]');
        const submitButton = form.querySelector('button[type="submit"]');
        let isFormValid = true;
        inputs.forEach(input => {
            const validator = validators[input.name];
            if (validator && validator(input.value) !== '') {
                isFormValid = false;
            }
        });
        if (submitButton) submitButton.disabled = !isFormValid;
    };

    allForms.forEach(form => {
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => validateField(input));
        });
        checkFormValidity(form);
    });

    // --- Form Submission Logic ---
    const handleFormSubmit = async (form) => {
        const button = form.querySelector('button[type="submit"]');
        const spinner = button.querySelector('.spinner');
        
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        button.disabled = true;
        spinner.classList.remove('hidden');

        try {
            if (form.id === 'signup-form') {
                const name = form.querySelector('#signup-name').value;
                const email = form.querySelector('#signup-email').value;
                const password = form.querySelector('#signup-password').value;

                const { error } = await _supabase.auth.signUp({
                    email, password, options: { data: { full_name: name } }
                });
                if (error) throw error;
                
                alert('সাইন-আপ সফল! আপনার ইমেইল চেক করে একাউন্ট ভেরিফাই করুন। এরপর লগইন করুন।');
                form.reset();
                if (loginTab) setActiveTab(loginTab);

            } else if (form.id === 'login-form') {
                const email = form.querySelector('#login-email').value;
                const password = form.querySelector('#login-password').value;

                const { error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                window.location.href = 'dashboard.html'; // Redirect on successful login
            }
        } catch (error) {
            console.error('Authentication Error:', error);
            const firstErrorContainer = form.querySelector('.error-message');
            let userMessage = 'একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
            if (error.message.includes("Invalid login credentials")) {
                userMessage = "ভুল ইমেইল অথবা পাসওয়ার্ড।";
            } else if (error.message.includes("already be registered")) {
                userMessage = "এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট তৈরি করা আছে।";
            }
            if (firstErrorContainer) firstErrorContainer.textContent = userMessage;
        } finally {
            spinner.classList.add('hidden');
            checkFormValidity(form);
        }
    };

    allForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(form);
        });
    });
});
