document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // This block was added to fix the "_supabase is not defined" error.
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

    // --- Theme Toggle Logic ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
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
        tabSlider.style.width = `${tab.offsetWidth}px`;
        tabSlider.style.left = `${tab.offsetLeft}px`;
    };
    const setActiveTab = (tab) => {
        const isLoginTab = tab === loginTab;
        loginTab.classList.toggle('text-[var(--text-secondary)]', !isLoginTab);
        signupTab.classList.toggle('text-[var(--text-secondary)]', isLoginTab);
        loginForm.classList.toggle('hidden', !isLoginTab);
        signupForm.classList.toggle('hidden', isLoginTab);
        updateSlider(tab);
    };
    loginTab.addEventListener('click', () => setActiveTab(loginTab));
    signupTab.addEventListener('click', () => setActiveTab(signupTab));
    setTimeout(() => updateSlider(loginTab), 50);

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
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        strengthBar.className = 'password-strength-bar'; // Reset classes
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
        const validator = validators[input.name];
        if (!validator) return;
        const errorMessage = validator(input.value);
        const errorElement = input.closest('.floating-label-group').querySelector('.error-message');
        if (errorElement) errorElement.textContent = errorMessage;
        
        if (input.name === 'signup-password') {
            checkPasswordStrength(input.value);
            validateField(confirmPasswordInput);
        }
        checkFormValidity(input.form);
    };

    const checkFormValidity = (form) => {
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
                setActiveTab(loginTab); // সাইন-আপের পর লগইন ট্যাবে পাঠানো হলো

            } else if (form.id === 'login-form') {
                const email = form.querySelector('#login-email').value;
                const password = form.querySelector('#login-password').value;

                const { error } = await _supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                window.location.href = 'dashboard.html';
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
