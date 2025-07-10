document.addEventListener('DOMContentLoaded', () => {
    // Elements (অপরিবর্তিত)
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

    // --- Supabase Client Initialization (নতুন যুক্ত করা হয়েছে) ---
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- সকল ফিচার অপরিবর্তিত রাখা হয়েছে ---
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

    const updateSlider = (tab) => {
        tabSlider.style.width = `${tab.offsetWidth}px`;
        tabSlider.style.left = `${tab.offsetLeft}px`;
    };
    const setActiveTab = (tab) => {
        if (tab === loginTab) {
            loginTab.classList.remove('text-[var(--text-secondary)]');
            signupTab.classList.add('text-[var(--text-secondary)]');
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            signupTab.classList.remove('text-[var(--text-secondary)]');
            loginTab.classList.add('text-[var(--text-secondary)]');
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
        updateSlider(tab);
    };
    loginTab.addEventListener('click', () => setActiveTab(loginTab));
    signupTab.addEventListener('click', () => setActiveTab(signupTab));
    setTimeout(() => updateSlider(loginTab), 50);

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.previousElementSibling;
            const eyeOpen = toggle.querySelector('.eye-open');
            const eyeClosed = toggle.querySelector('.eye-closed');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeOpen.classList.add('hidden');
                eyeClosed.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeOpen.classList.remove('hidden');
                eyeClosed.classList.add('hidden');
            }
        });
    });
    
    const validators = {
        'signup-name': (val) => val.length >= 3 ? '' : 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে।',
        'login-email': (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'সঠিক ইমেইল ঠিকানা লিখুন।',
        'signup-email': (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'সঠিক ইমেইল ঠিকানা লিখুন।',
        'login-password': (val) => val.length >= 6 ? '' : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
        'signup-password': (val) => {
            if (val.length < 8) return 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।';
            if (!/[A-Z]/.test(val)) return 'একটি বড় হাতের অক্ষর থাকতে হবে।';
            if (!/[a-z]/.test(val)) return 'একটি ছোট হাতের অক্ষর থাকতে হবে।';
            if (!/[0-9]/.test(val)) return 'একটি সংখ্যা থাকতে হবে।';
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

        strengthBar.classList.remove('weak', 'medium', 'strong');
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
        const errorMessage = validators[input.name](input.value);
        const errorElement = input.parentElement.querySelector('.error-message');
        if(errorElement) errorElement.textContent = errorMessage;
        
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
            if (validators[input.name] && validators[input.name](input.value) !== '') {
                isFormValid = false;
            }
        });
        if (submitButton) {
            submitButton.disabled = !isFormValid;
        }
    };

    allForms.forEach(form => {
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => validateField(input));
        });
        checkFormValidity(form);
    });

    // --- Form Submission (পরিবর্তিত এবং Supabase যুক্ত) ---
    allForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const spinner = button.querySelector('.spinner');
            const errorElement = form.querySelector('.error-message');
            
            // আগের সকল error মুছে ফেলা হলো
            if(errorElement) errorElement.textContent = '';
            const allErrorMessages = form.querySelectorAll('.error-message');
            allErrorMessages.forEach(el => el.textContent = '');

            button.disabled = true;
            if(spinner) spinner.classList.remove('hidden');

            try {
                if (form.id === 'signup-form') {
                    const name = document.getElementById('signup-name').value;
                    const email = document.getElementById('signup-email').value;
                    const password = document.getElementById('signup-password').value;

                    const { data, error } = await _supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: {
                            data: {
                                full_name: name
                            }
                        }
                    });

                    if (error) throw error;
                    
                    alert('সাইন-আপ সফল! আপনার ইমেইল চেক করে একাউন্ট ভেরিফাই করুন।');
                    form.reset(); // ফর্ম রিসেট করা হলো

                } else if (form.id === 'login-form') {
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;

                    const { data, error } = await _supabase.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (error) throw error;
                    
                    alert('লগইন সফল!');
                    window.location.href = 'dashboard.html';
                }
            } catch (error) {
                console.error('Authentication Error:', error.message);
                // প্রথম যে ইনপুটের সাথে error-message আছে, সেখানে দেখানো হলো
                const firstErrorContainer = form.querySelector('.error-message');
                if (firstErrorContainer) {
                    firstErrorContainer.textContent = error.message;
                }
            } finally {
                // লোডিং অবস্থা শেষ করা হলো
                if(spinner) spinner.classList.add('hidden');
                checkFormValidity(form); // বাটনটি পুনরায় فعال করা হলো
            }
        });
    });
});
