document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- DOM Elements ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const logoutButtonText = logoutButton.querySelector('.button-text');
    const logoutSpinner = logoutButton.querySelector('.spinner');
    
    const addBookBtn = document.getElementById('add-book-btn');
    const addBookModal = document.getElementById('add-book-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalBtnIcon = document.getElementById('close-modal-btn-icon');
    const addBookForm = document.getElementById('add-book-form');
    const booksContainer = document.getElementById('books-container');
    const saveBookBtn = document.getElementById('save-book-btn');
    const modalTitle = document.getElementById('modal-title');

    // Google Books Search Elements
    const bookSearchInput = document.getElementById('book-search-input');
    const bookSearchBtn = document.getElementById('book-search-btn');
    const searchResultsContainer = document.getElementById('search-results');

    let currentUser = null;
    let localBooks = []; 

    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };

    // --- Modal Interactivity ---
    const showModal = () => {
        addBookModal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    };

    const hideModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            addBookModal.classList.add('hidden');
            addBookForm.reset();
            searchResultsContainer.innerHTML = ''; // সার্চ রেজাল্ট পরিষ্কার করা
            bookSearchInput.value = ''; // সার্চ ইনপুট পরিষ্কার করা
            
            let hiddenInput = document.getElementById('edit-book-id');
            if (hiddenInput) {
                hiddenInput.value = '';
            }
            if(modalTitle) modalTitle.textContent = 'নতুন বই যোগ করুন';
        }, 300);
    };

    addBookBtn.addEventListener('click', () => {
        addBookForm.reset();
        let hiddenInput = document.getElementById('edit-book-id');
        if (hiddenInput) {
            hiddenInput.value = '';
        }
        if(modalTitle) modalTitle.textContent = 'নতুন বই যোগ করুন';
        searchResultsContainer.innerHTML = '';
        bookSearchInput.value = '';
        showModal();
    });

    closeModalBtn.addEventListener('click', hideModal);
    closeModalBtnIcon.addEventListener('click', hideModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) {
            hideModal();
        }
    });

    // --- Google Books API Search Functionality ---
    const displaySearchResults = (books) => {
        searchResultsContainer.innerHTML = '';
        if (!books || books.length === 0) {
            searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">কোনো বই খুঁজে পাওয়া যায়নি।</p>`;
            return;
        }

        books.slice(0, 5).forEach(book => { // প্রথম ৫টি ফলাফল দেখানো হচ্ছে
            const volumeInfo = book.volumeInfo;
            const title = volumeInfo.title;
            const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'লেখক অজানা';
            const cover = volumeInfo.imageLinks?.thumbnail || '';
            const pages = volumeInfo.pageCount || '';

            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <p class="search-result-title">${title}</p>
                <p class="search-result-author">${authors}</p>
            `;
            
            // ডেটা অ্যাট্রিবিউট সেট করা
            resultItem.dataset.title = title;
            resultItem.dataset.author = authors;
            resultItem.dataset.cover = cover;
            resultItem.dataset.pages = pages;

            searchResultsContainer.appendChild(resultItem);
        });
    };

    const handleBookSearch = async () => {
        const query = bookSearchInput.value.trim();
        if (!query) {
            alert('অনুসন্ধানের জন্য কিছু লিখুন।');
            return;
        }

        const searchButtonText = bookSearchBtn.querySelector('.button-text');
        const searchSpinner = bookSearchBtn.querySelector('.spinner');

        bookSearchBtn.disabled = true;
        if(searchButtonText) searchButtonText.classList.add('hidden');
        if(searchSpinner) searchSpinner.classList.remove('hidden');
        searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">অনুসন্ধান চলছে...</p>`;

        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            displaySearchResults(data.items);
        } catch (error) {
            console.error('Google Books API থেকে তথ্য আনতে সমস্যা হয়েছে:', error);
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
            
            searchResultsContainer.innerHTML = ''; // ফলাফল পরিষ্কার করা
            bookSearchInput.value = '';
        }
    });

    // --- Fetch and Display Books ---
    const fetchBooks = async () => {
        if (!currentUser) return;
        
        booksContainer.innerHTML = `<p class="text-lg text-gray-500 col-span-full text-center">বই লোড হচ্ছে...</p>`;

        const { data, error } = await _supabase
            .from('books')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('বই আনতে সমস্যা হয়েছে:', error);
            booksContainer.innerHTML = `<p class="text-lg text-red-500 col-span-full text-center">বই লোড করা সম্ভব হয়নি।</p>`;
            return;
        }

        localBooks = data;
        booksContainer.innerHTML = ''; 

        if (localBooks.length === 0) {
            booksContainer.innerHTML = `<p class="text-lg text-gray-500 col-span-full text-center">এখনো কোনো বই যোগ করা হয়নি। 'নতুন বই যোগ করুন' বাটনে ক্লিক করে শুরু করুন।</p>`;
        } else {
            localBooks.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300';
                
                const coverImageUrl = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover`;
                const statusText = statusMap[book.status] || 'N/A';
                const pageCountText = book.page_count ? `${book.page_count} পৃষ্ঠা` : '';

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
        }
    };

    // --- Event Delegation for Edit and Delete ---
    booksContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const bookId = e.target.dataset.id;
            if (confirm('আপনি কি সত্যিই এই বইটি মুছে ফেলতে চান?')) {
                const { error } = await _supabase.from('books').delete().eq('id', bookId);
                if (error) {
                    console.error('বই মুছতে সমস্যা হয়েছে:', error);
                    alert('বইটি মোছা সম্ভব হয়নি।');
                } else {
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

    // --- Save or Update Data in Supabase ---
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('অনুগ্রহ করে আবার লগইন করুন।');
            return;
        }

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
            alert('অনুগ্রহ করে বইয়ের নাম এবং লেখকের নাম দিন।');
            return;
        }

        const saveButtonText = saveBookBtn.querySelector('.button-text');
        const saveSpinner = saveBookBtn.querySelector('.spinner');
        saveBookBtn.disabled = true;
        saveButtonText.classList.add('hidden');
        saveSpinner.classList.remove('hidden');

        let error;
        if (bookIdToEdit) {
            const { error: updateError } = await _supabase.from('books').update(bookData).eq('id', bookIdToEdit);
            error = updateError;
        } else {
            const { error: insertError } = await _supabase.from('books').insert([bookData]);
            error = insertError;
        }

        saveBookBtn.disabled = false;
        saveButtonText.classList.remove('hidden');
        saveSpinner.classList.add('hidden');

        if (error) {
            console.error('বই সেভ/আপডেট করতে সমস্যা হয়েছে:', error);
            alert('কার্যক্রমটি সম্পন্ন করা সম্ভব হয়নি।');
        } else {
            hideModal();
            fetchBooks();
        }
    });

    // --- Initial User Data Fetch & Auth Check ---
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
            currentUser = session?.user;
            checkUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            window.location.replace('index.html');
        }
    });
    
    // --- Logout Functionality ---
    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        logoutButtonText.classList.add('hidden');
        logoutSpinner.classList.remove('hidden');
        await _supabase.auth.signOut();
    });
});
