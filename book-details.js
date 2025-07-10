document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // This block was added to fix the "_supabase is not defined" error.
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // A simple toast notification function (assuming Toastify.js is included)
    const showToast = (message, type = 'success') => {
        const background = type === 'success' 
            ? 'linear-gradient(to right, #00b09b, #96c93d)' 
            : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        
        Toastify({
            text: message,
            duration: 3000,
            gravity: "bottom",
            position: "right",
            style: { background },
        }).showToast();
    };

    // --- DOM Elements ---
    const bookCover = document.getElementById('book-cover');
    const bookTitle = document.getElementById('book-title');
    const bookAuthor = document.getElementById('book-author');
    const starRatingContainer = document.getElementById('star-rating-container');
    const bookPageCount = document.getElementById('book-page-count');
    const bookStatusElem = document.getElementById('book-status');
    const personalNotes = document.getElementById('personal-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const deleteBookBtn = document.getElementById('delete-book-btn');
    const loader = document.getElementById('loader');
    const contentWrapper = document.getElementById('content-wrapper');

    let currentUser = null;
    let currentBookId = null;
    
    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };

    // --- Star Rating Logic ---
    const renderStars = (rating = 0) => {
        starRatingContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            star.setAttribute('class', `w-8 h-8 cursor-pointer transition-colors duration-200 ${i <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`);
            star.setAttribute('fill', 'currentColor');
            star.setAttribute('viewBox', '0 0 20 20');
            star.dataset.value = i;
            star.innerHTML = `<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />`;
            starRatingContainer.appendChild(star);
        }
    };
    
    starRatingContainer.addEventListener('click', async (e) => {
        const star = e.target.closest('svg');
        if (star) {
            const newRating = parseInt(star.dataset.value, 10);
            if (!currentBookId || !currentUser) return;

            // Optimistic UI update
            renderStars(newRating);

            const { error } = await _supabase
                .from('books')
                .update({ rating: newRating })
                .eq('id', currentBookId)
                .eq('user_id', currentUser.id);

            if (error) {
                showToast('রেটিং আপডেট করা সম্ভব হয়নি।', 'error');
                console.error('Rating update error:', error);
                // Revert on error
                fetchBookDetails(currentBookId); 
            } else {
                showToast('রেটিং সফলভাবে সেভ হয়েছে!');
            }
        }
    });

    // --- Fetch and Display Book Details ---
    const fetchBookDetails = async (bookId) => {
        loader.classList.remove('hidden');
        contentWrapper.classList.add('hidden');

        try {
            const { data: book, error } = await _supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .eq('user_id', currentUser.id)
                .single();

            if (error || !book) {
                throw new Error('বইটি খুঁজে পাওয়া যায়নি বা এটি আপনার নয়।');
            }

            bookCover.src = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=${encodeURIComponent(book.title)}`;
            bookCover.alt = `${book.title} এর কভার`;
            bookTitle.textContent = book.title;
            bookAuthor.textContent = `লেখক: ${book.author}`;
            bookPageCount.textContent = book.page_count ? book.page_count.toLocaleString('bn-BD') : 'অজানা';
            bookStatusElem.textContent = statusMap[book.status] || 'অজানা';
            personalNotes.value = book.personal_notes || '';
            renderStars(book.rating);

            contentWrapper.classList.remove('hidden');

        } catch (err) {
            console.error('Error fetching book:', err);
            showToast(err.message, 'error');
            setTimeout(() => {
                 window.location.replace('./dashboard.html');
            }, 2000);
        } finally {
            loader.classList.add('hidden');
        }
    };

    // --- Save Personal Notes ---
    saveNotesBtn.addEventListener('click', async () => {
        const notes = personalNotes.value.trim();
        const buttonText = saveNotesBtn.querySelector('.button-text');
        const spinner = saveNotesBtn.querySelector('.spinner');

        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
        saveNotesBtn.disabled = true;

        const { error } = await _supabase
            .from('books')
            .update({ personal_notes: notes })
            .eq('id', currentBookId)
            .eq('user_id', currentUser.id);

        if (error) {
            showToast('নোট সেভ করা সম্ভব হয়নি।', 'error');
            console.error('Notes save error:', error);
        } else {
            showToast('নোট সফলভাবে সেভ করা হয়েছে!');
        }
        
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
        saveNotesBtn.disabled = false;
    });

    // --- Delete Book ---
    deleteBookBtn.addEventListener('click', async () => {
        if (confirm('আপনি কি নিশ্চিতভাবে এই বইটি মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।')) {
            const buttonText = deleteBookBtn.querySelector('.button-text');
            const spinner = deleteBookBtn.querySelector('.spinner');

            buttonText.classList.add('hidden');
            spinner.classList.remove('hidden');
            deleteBookBtn.disabled = true;

            const { error } = await _supabase
                .from('books')
                .delete()
                .eq('id', currentBookId)
                .eq('user_id', currentUser.id);

            if (error) {
                showToast('বইটি মোছা সম্ভব হয়নি।', 'error');
                console.error('Delete error:', error);
                buttonText.classList.remove('hidden');
                spinner.classList.add('hidden');
                deleteBookBtn.disabled = false;
            } else {
                showToast('বইটি সফলভাবে মুছে ফেলা হয়েছে।');
                window.location.replace('./dashboard.html');
            }
        }
    });

    // --- Page Initialization ---
    const initializePage = async () => {
        const params = new URLSearchParams(window.location.search);
        currentBookId = params.get('id');

        if (!currentBookId) {
            window.location.replace('./dashboard.html');
            return;
        }

        const { data: { user } } = await _supabase.auth.getUser();
        if (user) {
            currentUser = user;
            fetchBookDetails(currentBookId);
        } else {
            window.location.replace('./login.html');
        }
    };

    initializePage();
});
