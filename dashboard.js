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

    let currentUser = null;

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
        }, 300);
    };

    addBookBtn.addEventListener('click', showModal);
    closeModalBtn.addEventListener('click', hideModal);
    closeModalBtnIcon.addEventListener('click', hideModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) {
            hideModal();
        }
    });

    // --- Fetch and Display Books ---
    const fetchBooks = async () => {
        if (!currentUser) return;
        
        booksContainer.innerHTML = `<p class="text-lg text-gray-500 col-span-full text-center">বই লোড হচ্ছে...</p>`;

        const { data: books, error } = await _supabase
            .from('books')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('বই আনতে সমস্যা হয়েছে:', error);
            booksContainer.innerHTML = `<p class="text-lg text-red-500 col-span-full text-center">বই লোড করা সম্ভব হয়নি।</p>`;
            return;
        }

        booksContainer.innerHTML = ''; 

        if (books.length === 0) {
            booksContainer.innerHTML = `<p class="text-lg text-gray-500 col-span-full text-center">এখনো কোনো বই যোগ করা হয়নি। 'নতুন বই যোগ করুন' বাটনে ক্লিক করে শুরু করুন।</p>`;
        } else {
            books.forEach(book => {
                const bookCard = document.createElement('div');
                bookCard.className = 'bg-white rounded-lg shadow-lg overflow-hidden flex flex-col transform hover:-translate-y-2 transition-transform duration-300';
                
                const coverImageUrl = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover`;
                const statusText = statusMap[book.status] || 'N/A';
                const pageCountText = book.page_count ? `${book.page_count} পৃষ্ঠা` : '';

                bookCard.innerHTML = `
                    <img src="${coverImageUrl}" alt="${book.title} এর কভার" class="w-full h-64 object-cover">
                    <div class="p-5 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-[#4A3F35] flex-grow">${book.title}</h3>
                        <p class="text-md text-gray-600 mt-1 mb-3"> - ${book.author}</p>
                        <div class="mt-auto pt-3 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                            <span class="font-semibold text-[#785A3E]">${statusText}</span>
                            <span>${pageCountText}</span>
                        </div>
                    </div>
                `;
                booksContainer.appendChild(bookCard);
            });
        }
    };

    // --- Save Data to Supabase ---
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('অনুগ্রহ করে আবার লগইন করুন।');
            return;
        }

        const title = document.getElementById('book-title').value.trim();
        const author = document.getElementById('book-author').value.trim();
        const cover_image_url = document.getElementById('book-cover-url').value.trim() || null;
        const page_count_val = document.getElementById('book-page-count').value;
        const page_count = page_count_val ? parseInt(page_count_val, 10) : null;
        const status = document.getElementById('book-status').value;

        if (!title || !author) {
            alert('অনুগ্রহ করে বইয়ের নাম এবং লেখকের নাম দিন।');
            return;
        }

        const saveButtonText = saveBookBtn.querySelector('.button-text');
        const saveSpinner = saveBookBtn.querySelector('.spinner');

        saveBookBtn.disabled = true;
        saveButtonText.classList.add('hidden');
        saveSpinner.classList.remove('hidden');

        const { error } = await _supabase
            .from('books')
            .insert([{ 
                title, 
                author, 
                cover_image_url,
                page_count,
                status,
                user_id: currentUser.id 
            }]);

        saveBookBtn.disabled = false;
        saveButtonText.classList.remove('hidden');
        saveSpinner.classList.add('hidden');

        if (error) {
            console.error('বই সেভ করতে সমস্যা হয়েছে:', error);
            alert('বইটি সেভ করা সম্ভব হয়নি।');
        } else {
            hideModal();
            fetchBooks(); // তালিকা রিফ্রেশ করা
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
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            checkUser();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            window.location.replace('index.html');
        }
    });
    
    checkUser(); 

    // --- Logout Functionality ---
    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        logoutButtonText.classList.add('hidden');
        logoutSpinner.classList.remove('hidden');
        await _supabase.auth.signOut();
    });
});
