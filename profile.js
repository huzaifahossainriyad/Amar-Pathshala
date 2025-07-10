document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- DOM Elements ---
    const userNameDisplay = document.getElementById('user-name');
    const totalBooksReadElem = document.getElementById('total-books-read');
    const totalPagesReadElem = document.getElementById('total-pages-read');
    const passwordUpdateForm = document.getElementById('password-update-form');
    const newPasswordInput = document.getElementById('new-password');
    const updatePasswordBtn = document.getElementById('update-password-btn');

    let currentUser = null;

    /**
     * ব্যবহারকারীর পড়ার পরিসংখ্যান গণনা করে এবং পৃষ্ঠায় প্রদর্শন করে।
     */
    const calculateAndDisplayStats = async () => {
        if (!currentUser) return;

        // ডেটা লোড হওয়ার প্রাথমিক অবস্থা দেখানো
        totalBooksReadElem.textContent = 'লোড হচ্ছে...';
        totalPagesReadElem.textContent = 'লোড হচ্ছে...';

        const { data: books, error } = await _supabase
            .from('books')
            .select('status, page_count')
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('বইয়ের তথ্য আনতে সমস্যা হয়েছে:', error);
            totalBooksReadElem.textContent = 'ত্রুটি';
            totalPagesReadElem.textContent = 'ত্রুটি';
            return;
        }

        // যে বইগুলো পড়া শেষ হয়েছে, সেগুলো ফিল্টার করা
        const readBooks = books.filter(book => book.status === 'read');

        // মোট পড়া বইয়ের সংখ্যা গণনা
        const totalBooks = readBooks.length;

        // মোট পড়া পৃষ্ঠার সংখ্যা গণনা
        const totalPages = readBooks.reduce((sum, book) => {
            // নিশ্চিত করা যে page_count একটি বৈধ সংখ্যা
            const pageCount = Number(book.page_count);
            return sum + (isNaN(pageCount) ? 0 : pageCount);
        }, 0);

        // পৃষ্ঠায় ফলাফল প্রদর্শন
        totalBooksReadElem.textContent = totalBooks.toLocaleString('bn-BD');
        totalPagesReadElem.textContent = totalPages.toLocaleString('bn-BD');
    };

    /**
     * পাসওয়ার্ড আপডেট ফর্ম জমা দেওয়ার প্রক্রিয়া পরিচালনা করে।
     */
    passwordUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value.trim();

        if (newPassword.length < 6) {
            alert('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।');
            return;
        }

        const buttonText = updatePasswordBtn.querySelector('.button-text');
        const spinner = updatePasswordBtn.querySelector('.spinner');

        // বোতাম নিষ্ক্রিয় করা এবং স্পিনার দেখানো
        updatePasswordBtn.disabled = true;
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');

        const { error } = await _supabase.auth.updateUser({
            password: newPassword
        });

        // বোতাম সক্রিয় করা এবং স্পিনার লুকানো
        updatePasswordBtn.disabled = false;
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');

        if (error) {
            console.error('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে:', error);
            alert(`ত্রুটি: ${error.message}`);
        } else {
            alert('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
            passwordUpdateForm.reset();
        }
    });

    /**
     * ব্যবহারকারীর সেশন পরীক্ষা করে এবং পৃষ্ঠা শুরু করে।
     */
    const checkUserAndInitialize = async () => {
        const { data: { user } } = await _supabase.auth.getUser();

        if (user) {
            currentUser = user;
            const fullName = user.user_metadata.full_name || 'ব্যবহারকারী';
            if (userNameDisplay) {
                userNameDisplay.textContent = `স্বাগতম, ${fullName}`;
            }
            // পরিসংখ্যান লোড করার ফাংশন কল করা
            calculateAndDisplayStats();
        } else {
            // যদি কোনো ব্যবহারকারী লগইন না করে থাকেন, তবে তাকে লগইন পৃষ্ঠায় পাঠানো হবে।
            window.location.replace('login.html');
        }
    };

    // পৃষ্ঠা লোড হওয়ার সাথে সাথে ব্যবহারকারী পরীক্ষা করা
    checkUserAndInitialize();
});
