document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- DOM Elements ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const addBookBtn = document.getElementById('add-book-btn');
    const addBookModal = document.getElementById('add-book-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalBtnIcon = document.getElementById('close-modal-btn-icon');
    const addBookForm = document.getElementById('add-book-form');
    const booksContainer = document.getElementById('books-container');
    const saveBookBtn = document.getElementById('save-book-btn');
    const modalTitle = document.getElementById('modal-title');
    const bookSearchInput = document.getElementById('book-search-input');
    const bookSearchBtn = document.getElementById('book-search-btn');
    const searchResultsContainer = document.getElementById('search-results');
    const librarySearchInput = document.getElementById('library-search-input');
    const statusFilter = document.getElementById('status-filter');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const libraryControls = document.getElementById('library-controls');

    // --- Goal Elements ---
    const goalTitle = document.getElementById('goal-title');
    const goalProgressText = document.getElementById('goal-progress-text');
    const goalProgressBarContainer = document.getElementById('goal-progress-bar-container');
    const setGoalBtn = document.getElementById('set-goal-btn');
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalInput = document.getElementById('goal-input');
    const closeGoalModalBtn = document.getElementById('close-goal-modal-btn');

    let currentUser = null;
    let localBooks = []; // সব বইয়ের মাস্টার লিস্ট

    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };
    
    // --- Toast Notification Helpers ---
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


    // --- Display Books on the Page ---
    const displayBooks = (booksToDisplay) => {
        booksContainer.innerHTML = ''; 
        booksToDisplay.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300';
            const coverImageUrl = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover`;
            const statusText = statusMap[book.status] || 'N/A';
            const pageCountText = book.page_count ? `${book.page_count.toLocaleString('bn-BD')} পৃষ্ঠা` : '';
            bookCard.innerHTML = `
                <img src="${coverImageUrl}" alt="${book.title} এর কভার" class="w-full h-64 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover';">
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold text-[#4A3F35] flex-grow">${book.title}</h3>
                    <p class="text-md text-gray-600 mt-1 mb-3"> - ${book.author}</p>
                    <div class="mt-auto pt-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                        <span class="font-semibold text-[#785A3E]">${statusText}</span>
                        <span>${pageCountText}</span>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 border-t flex justify-end gap-2">
                    <button class="edit-btn" data-id="${book.id}">সম্পাদনা</button>
                    <button class="delete-btn" data-id="${book.id}">মুছে ফেলুন</button>
                </div>
            `;
            booksContainer.appendChild(bookCard);
        });
    };
    
    // --- Filter and Search Logic ---
    const applyFilters = () => {
        const searchTerm = librarySearchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        if (!localBooks) localBooks = [];

        const filteredBooks = localBooks.filter(book => {
            const titleMatch = book.title.toLowerCase().includes(searchTerm);
            const authorMatch = book.author.toLowerCase().includes(searchTerm);
            const statusMatch = selectedStatus === 'all' || book.status === selectedStatus;
            return (titleMatch || authorMatch) && statusMatch;
        });

        if (filteredBooks.length > 0) {
            emptyState.classList.add('hidden');
            booksContainer.classList.remove('hidden');
            displayBooks(filteredBooks);
        } else {
            // This handles the "no search results" case
            booksContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 'কোনো বই পাওয়া যায়নি';
            emptyState.querySelector('p').textContent = 'আপনার ফিল্টার বা সার্চের সাথে মেলে এমন কোনো বই নেই। ভিন্ন কিছু দিয়ে চেষ্টা করুন।';
        }
    };

    librarySearchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);

    // --- Fetch and Display Reading Goal ---
    const fetchAndDisplayGoal = async () => {
        if (!currentUser) return;

        const currentYear = new Date().getFullYear();
        const bengaliYear = currentYear.toLocaleString('bn-BD', { useGrouping: false });
        const completedBooks = localBooks.filter(book => book.status === 'read').length;

        const { data: goalData, error: goalError } = await _supabase
            .from('goals')
            .select('target_books')
            .eq('user_id', currentUser.id)
            .eq('year', currentYear)
            .single();

        if (goalError && goalError.code !== 'PGRST116') {
            console.error('Error fetching goal:', goalError);
            goalTitle.textContent = 'লক্ষ্য আনতে সমস্যা হয়েছে।';
            return;
        }

        if (goalData) {
            const target = goalData.target_books;
            const progressPercentage = target > 0 ? (completedBooks / target) * 100 : 0;
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = `${completedBooks.toLocaleString('bn-BD')} / ${target.toLocaleString('bn-BD')} টি বই`;
            goalProgressBarContainer.innerHTML = `<div class="goal-progress-bar-inner" style="width: ${Math.min(progressPercentage, 100)}%;"></div>`;
        } else {
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = 'এই বছরের জন্য কোনো লক্ষ্য ঠিক করা হয়নি।';
            goalProgressBarContainer.innerHTML = '';
        }
    };

    // --- Fetch Books from Supabase ---
    const fetchBooks = async () => {
        if (!currentUser) return;

        loader.classList.remove('hidden');
        booksContainer.classList.add('hidden');
        libraryControls.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            const { data, error } = await _supabase
                .from('books')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('বই আনতে সমস্যা হয়েছে:', error);
                emptyState.classList.remove('hidden');
                emptyState.querySelector('h3').textContent = 'একটি সমস্যা হয়েছে';
                emptyState.querySelector('p').textContent = 'বই লোড করা সম্ভব হয়নি। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।';
                return;
            }

            localBooks = data;

            if (localBooks.length === 0) {
                libraryControls.classList.add('hidden');
                emptyState.classList.remove('hidden');
                emptyState.querySelector('h3').textContent = 'আপনার পাঠশালা এখনো খালি';
                emptyState.querySelector('p').textContent = 'আপনি এখনো কোনো বই যোগ করেননি। "নতুন বই যোগ করুন" বাটনে ক্লিক করে আপনার প্রথম বইটি যোগ করুন!';
            } else {
                libraryControls.classList.remove('hidden');
                applyFilters();
            }

            await fetchAndDisplayGoal();
        } catch (err) {
            console.error('Fetch books failed:', err);
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 'একটি অপ্রত্যাশিত সমস্যা হয়েছে';
            emptyState.querySelector('p').textContent = 'ডেটা লোড করা সম্ভব হয়নি।';
        } finally {
            loader.classList.add('hidden');
        }
    };

    // --- Modal Interactivity ---
    const showModal = () => {
        addBookModal.classList.remove('hidden');
        setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);
    };

    const hideModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            addBookModal.classList.add('hidden');
            addBookForm.reset();
            searchResultsContainer.innerHTML = '';
            bookSearchInput.value = '';
            const hiddenInput = document.getElementById('edit-book-id');
            if (hiddenInput) hiddenInput.value = '';
            if (modalTitle) modalTitle.textContent = 'নতুন বই যোগ করুন';
        }, 300);
    };

    addBookBtn.addEventListener('click', () => {
        addBookForm.reset();
        const hiddenInput = document.getElementById('edit-book-id');
        if (hiddenInput) hiddenInput.value = '';
        if (modalTitle) modalTitle.textContent = 'নতুন বই যোগ করুন';
        searchResultsContainer.innerHTML = '';
        bookSearchInput.value = '';
        showModal();
    });

    closeModalBtn.addEventListener('click', hideModal);
    closeModalBtnIcon.addEventListener('click', hideModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) hideModal();
    });
    
    // --- Goal Modal Logic ---
    setGoalBtn.addEventListener('click', async () => {
        const currentYear = new Date().getFullYear();
        const { data } = await _supabase.from('goals').select('target_books').eq('user_id', currentUser.id).eq('year', currentYear).single();
        if (data) {
            goalInput.value = data.target_books;
        } else {
            goalInput.value = '';
        }
        goalModal.classList.remove('hidden');
    });

    closeGoalModalBtn.addEventListener('click', () => {
        goalModal.classList.add('hidden');
    });
    
    goalModal.addEventListener('click', (e) => {
        if (e.target === goalModal) {
            goalModal.classList.add('hidden');
        }
    });

    goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newGoal = parseInt(goalInput.value, 10);
        if (!newGoal || newGoal < 1) {
            showToast('অনুগ্রহ করে একটি সঠিক সংখ্যা দিন।', 'error');
            return;
        }
        const currentYear = new Date().getFullYear();
        const { error } = await _supabase
            .from('goals')
            .upsert({
                user_id: currentUser.id,
                year: currentYear,
                target_books: newGoal
            }, {
                onConflict: 'user_id, year'
            });

        if (error) {
            console.error('Error setting goal:', error);
            showToast('লক্ষ্য ঠিক করতে সমস্যা হয়েছে।', 'error');
        } else {
            showToast('আপনার পড়ার লক্ষ্য সফলভাবে সেট করা হয়েছে!');
            goalModal.classList.add('hidden');
            await fetchAndDisplayGoal();
        }
    });


    // --- Google Books API Search ---
    const displayGBSearchResults = (books) => {
        searchResultsContainer.innerHTML = '';
        if (!books || books.length === 0) {
            searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">কোনো বই খুঁজে পাওয়া যায়নি।</p>`;
            return;
        }
        books.slice(0, 5).forEach(book => {
            const { volumeInfo } = book;
            const title = volumeInfo.title;
            const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'লেখক অজানা';
            const cover = volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail || '';
            const pages = volumeInfo.pageCount || '';
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `<p class="search-result-title">${title}</p><p class="search-result-author">${authors}</p>`;
            resultItem.dataset.title = title;
            resultItem.dataset.author = authors;
            resultItem.dataset.cover = cover;
            resultItem.dataset.pages = pages;
            searchResultsContainer.appendChild(resultItem);
        });
    };

    const handleBookSearch = async () => {
        const query = bookSearchInput.value.trim();
        if (!query) return;
        const searchButtonText = bookSearchBtn.querySelector('.button-text');
        const searchSpinner = bookSearchBtn.querySelector('.spinner');
        bookSearchBtn.disabled = true;
        if(searchButtonText) searchButtonText.classList.add('hidden');
        if(searchSpinner) searchSpinner.classList.remove('hidden');
        searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">অনুসন্ধান চলছে...</p>`;
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            displayGBSearchResults(data.items);
        } catch (error) {
            console.error('Google Books API Error:', error);
            searchResultsContainer.innerHTML = `<p class="text-center text-red-500 p-4">অনুসন্ধান ব্যর্থ হয়েছে।</p>`;
        } finally {
            bookSearchBtn.disabled = false;
            if(searchButtonText) searchButtonText.classList.remove('hidden');
            if(searchSpinner) searchSpinner.classList.add('hidden');
        }
    };

    bookSearchBtn.addEventListener('click', handleBookSearch);
    bookSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBookSearch();
        }
    });

    searchResultsContainer.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            document.getElementById('book-title').value = item.dataset.title;
            document.getElementById('book-author').value = item.dataset.author;
            document.getElementById('book-cover-url').value = item.dataset.cover;
            document.getElementById('book-page-count').value = item.dataset.pages;
            searchResultsContainer.innerHTML = '';
            bookSearchInput.value = '';
        }
    });

    // --- CRUD Event Listeners (Edit/Delete) ---
    booksContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const bookId = e.target.dataset.id;
            if (confirm('আপনি কি সত্যিই এই বইটি মুছে ফেলতে চান?')) {
                const { error } = await _supabase.from('books').delete().eq('id', bookId);
                if (error) {
                    console.error('Delete Error:', error);
                    showToast('বইটি মোছা সম্ভব হয়নি।', 'error');
                } else {
                    showToast('বইটি সফলভাবে মুছে ফেলা হয়েছে');
                    fetchBooks();
                }
            }
        }
        if (e.target.classList.contains('edit-btn')) {
            const bookId = e.target.dataset.id;
            const bookToEdit = localBooks.find(book => book.id == bookId);
            if (bookToEdit) {
                document.getElementById('book-title').value = bookToEdit.title;
                document.getElementById('book-author').value = bookToEdit.author;
                document.getElementById('book-cover-url').value = bookToEdit.cover_image_url || '';
                document.getElementById('book-page-count').value = bookToEdit.page_count || '';
                document.getElementById('book-status').value = bookToEdit.status;
                document.getElementById('edit-book-id').value = bookToEdit.id;
                if(modalTitle) modalTitle.textContent = 'বই সম্পাদনা করুন';
                showModal();
            }
        }
    });

    // --- Save/Update Form Submission ---
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const bookData = {
            title: document.getElementById('book-title').value.trim(),
            author: document.getElementById('book-author').value.trim(),
            cover_image_url: document.getElementById('book-cover-url').value.trim() || null,
            page_count: parseInt(document.getElementById('book-page-count').value, 10) || null,
            status: document.getElementById('book-status').value,
            user_id: currentUser.id
        };
        const bookIdToEdit = document.getElementById('edit-book-id').value;
        if (!bookData.title || !bookData.author) {
            showToast('অনুগ্রহ করে বইয়ের নাম এবং লেখকের নাম দিন।', 'error');
            return;
        }
        const saveButtonText = saveBookBtn.querySelector('.button-text');
        const saveSpinner = saveBookBtn.querySelector('.spinner');
        saveBookBtn.disabled = true;
        saveButtonText.classList.add('hidden');
        saveSpinner.classList.remove('hidden');
        let error;
        let successMessage = '';

        if (bookIdToEdit) {
            const { error: updateError } = await _supabase.from('books').update(bookData).eq('id', bookIdToEdit);
            error = updateError;
            successMessage = 'বইটি সফলভাবে আপডেট করা হয়েছে';
        } else {
            const { error: insertError } = await _supabase.from('books').insert([bookData]);
            error = insertError;
            successMessage = 'বইটি সফলভাবে যোগ করা হয়েছে';
        }

        saveBookBtn.disabled = false;
        saveButtonText.classList.remove('hidden');
        saveSpinner.classList.add('hidden');

        if (error) {
            console.error('Save/Update Error:', error);
            showToast('কার্যক্রমটি সম্পন্ন করা সম্ভব হয়নি।', 'error');
        } else {
            showToast(successMessage);
            hideModal();
            fetchBooks();
        }
    });

    // --- Auth and Initial Load ---
    const checkUser = async () => {
        const { data: { user } } = await _supabase.auth.getUser();
        if (user) {
            currentUser = user;
            const fullName = user.user_metadata.full_name || 'ব্যবহারকারী';
            userWelcomeMessage.textContent = `স্বাগতম, ${fullName}`;
            fetchBooks();
        } else {
            window.location.replace('login.html');
        }
    };
    
    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session) {
                currentUser = session.user;
                checkUser();
            }
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            window.location.replace('index.html');
        }
    });
    
    logoutButton.addEventListener('click', async () => {
        const { error } = await _supabase.auth.signOut();
        if (error) console.error("Logout error", error);
    });
});
