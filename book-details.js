document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // Make sure to replace with your actual Supabase URL and Anon Key
    const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';
    const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // --- Utility Functions ---
    const showToast = (message, type = 'success') => {
        const background = type === 'success' 
            ? 'linear-gradient(to right, #00b09b, #96c93d)' 
            : 'linear-gradient(to right, #ff5f6d, #ffc371)';
        Toastify({ text: message, duration: 3000, gravity: "bottom", position: "right", style: { background } }).showToast();
    };

    // --- DOM Elements ---
    const bookCover = document.getElementById('book-cover');
    const bookTitle = document.getElementById('book-title');
    const bookAuthor = document.getElementById('book-author');
    const starRatingContainer = document.getElementById('star-rating-container');
    const bookPageCount = document.getElementById('book-page-count');
    const bookStatusElem = document.getElementById('book-status');
    const bookGenre = document.getElementById('book-genre');
    const bookFormat = document.getElementById('book-format');
    const personalNotes = document.getElementById('personal-notes');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const deleteBookBtn = document.getElementById('delete-book-btn');
    const loader = document.getElementById('loader');
    const contentWrapper = document.getElementById('content-wrapper');
    const customShelvesContainer = document.getElementById('custom-shelves-container');
    const loanStatusContainer = document.getElementById('loan-status-container');
    const addQuoteBtn = document.getElementById('add-quote-btn');
    const quoteTextInput = document.getElementById('quote-text');
    const quotePageInput = document.getElementById('quote-page-number');
    const quotesListContainer = document.getElementById('quotes-list-container');

    // --- State Variables ---
    let currentUser = null;
    let currentBookId = null;

    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };

    // --- Main Fetch Function ---
    const fetchBookDetails = async (bookId) => {
        loader.classList.remove('hidden');
        contentWrapper.classList.add('hidden');

        try {
            // Parallel fetching for efficiency
            const [bookDetails, quotes, loan, allShelves, bookShelves] = await Promise.all([
                _supabase.from('books').select('*').eq('id', bookId).eq('user_id', currentUser.id).single(),
                _supabase.from('quotes').select('*').eq('book_id', bookId).order('created_at', { ascending: false }),
                _supabase.from('loans').select('*').eq('book_id', bookId).eq('is_returned', false).maybeSingle(),
                _supabase.from('custom_shelves').select('id, name').eq('user_id', currentUser.id),
                _supabase.from('book_shelves').select('shelf_id').eq('book_id', bookId)
            ]);

            // Handle Book Details
            if (bookDetails.error || !bookDetails.data) throw new Error('বইটি খুঁজে পাওয়া যায়নি বা এটি আপনার নয়।');
            const book = bookDetails.data;
            bookCover.src = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=${encodeURIComponent(book.title)}`;
            bookCover.alt = `${book.title} এর কভার`;
            bookTitle.textContent = book.title;
            bookAuthor.textContent = `লেখক: ${book.author}`;
            bookPageCount.textContent = book.page_count ? book.page_count.toLocaleString('bn-BD') : 'অজানা';
            bookStatusElem.textContent = statusMap[book.status] || 'অজানা';
            bookGenre.textContent = book.genre || 'অজানা';
            bookFormat.textContent = book.format || 'অজানা';
            personalNotes.value = book.personal_notes || '';
            renderStars(book.rating);

            // Handle Quotes
            if (quotes.error) throw new Error('উক্তি আনতে সমস্যা হয়েছে।');
            renderQuotes(quotes.data);

            // Handle Loan Status
            if (loan.error) throw new Error('লোন স্ট্যাটাস আনতে সমস্যা হয়েছে।');
            renderLoanStatus(loan.data);
            
            // Handle Custom Shelves
            if (allShelves.error || bookShelves.error) throw new Error('কাস্টম শেলফ আনতে সমস্যা হয়েছে।');
            const checkedShelfIds = new Set(bookShelves.data.map(bs => bs.shelf_id));
            renderCustomShelves(allShelves.data, checkedShelfIds);

            contentWrapper.classList.remove('hidden');
        } catch (err) {
            console.error('Error fetching book details:', err);
            showToast(err.message, 'error');
            setTimeout(() => { window.location.replace('./dashboard.html'); }, 2000);
        } finally {
            loader.classList.add('hidden');
        }
    };

    // --- Render Functions ---
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
    
    const renderCustomShelves = (shelves, checkedShelfIds) => {
        customShelvesContainer.innerHTML = '';
        if (shelves.length === 0) {
            customShelvesContainer.innerHTML = `<p class="text-gray-500">আপনার কোনো কাস্টম শেলফ নেই।</p>`;
            return;
        }
        shelves.forEach(shelf => {
            const isChecked = checkedShelfIds.has(shelf.id);
            const div = document.createElement('div');
            div.className = 'flex items-center';
            div.innerHTML = `
                <input id="shelf-${shelf.id}" type="checkbox" ${isChecked ? 'checked' : ''} data-shelf-id="${shelf.id}" class="h-4 w-4 rounded border-gray-300 text-[#785A3E] focus:ring-[#785A3E]">
                <label for="shelf-${shelf.id}" class="ml-3 block text-md font-medium text-gray-700">${shelf.name}</label>
            `;
            customShelvesContainer.appendChild(div);
        });
    };
    
    const renderLoanStatus = (loan) => {
        loanStatusContainer.innerHTML = '';
        if (loan) {
            loanStatusContainer.innerHTML = `
                <p class="text-lg text-gray-800 mb-4">বইটি <strong class="font-semibold">${loan.borrower_name}</strong>-কে ধার দেওয়া হয়েছে।</p>
                <button id="mark-as-returned-btn" data-loan-id="${loan.id}" class="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    ফেরত হিসেবে চিহ্নিত করুন
                </button>
            `;
        } else {
            loanStatusContainer.innerHTML = `
                <p class="text-lg text-gray-600 mb-4">এই বইটি বর্তমানে আপনার কাছেই আছে।</p>
                <button id="loan-out-btn" class="py-2 px-4 bg-[#785A3E] text-white rounded-lg hover:bg-[#664c32] transition">
                    এই বইটি ধার দিন
                </button>
            `;
        }
    };

    const renderQuotes = (quotes) => {
        quotesListContainer.innerHTML = '';
        if (quotes.length === 0) {
            quotesListContainer.innerHTML = `<p class="text-center text-gray-500 py-4">এই বইয়ের জন্য এখনো কোনো উক্তি যোগ করা হয়নি।</p>`;
            return;
        }
        quotes.forEach(quote => {
            const quoteCard = document.createElement('div');
            quoteCard.className = 'bg-white/80 p-5 rounded-lg shadow-sm border border-gray-200 relative';
            quoteCard.innerHTML = `
                <blockquote class="text-lg italic text-gray-800 border-l-4 border-[#785A3E] pl-4">
                    <p>"${quote.quote_text}"</p>
                </blockquote>
                ${quote.page_number ? `<p class="text-right text-sm text-gray-500 mt-2">পৃষ্ঠা: ${quote.page_number.toLocaleString('bn-BD')}</p>` : ''}
                <button data-quote-id="${quote.id}" class="delete-quote-btn absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            quotesListContainer.appendChild(quoteCard);
        });
    };

    // --- Event Listeners ---
    starRatingContainer.addEventListener('click', async (e) => {
        const star = e.target.closest('svg');
        if (!star) return;
        const newRating = parseInt(star.dataset.value, 10);
        renderStars(newRating); // Optimistic UI update
        const { error } = await _supabase.from('books').update({ rating: newRating }).eq('id', currentBookId);
        if (error) {
            showToast('রেটিং আপডেট করা সম্ভব হয়নি।', 'error');
            fetchBookDetails(currentBookId); // Revert on error
        } else {
            showToast('রেটিং সফলভাবে সেভ হয়েছে!');
        }
    });

    saveNotesBtn.addEventListener('click', async () => {
        const notes = personalNotes.value.trim();
        saveNotesBtn.disabled = true;
        saveNotesBtn.querySelector('.spinner').classList.remove('hidden');
        saveNotesBtn.querySelector('.button-text').classList.add('hidden');
        
        const { error } = await _supabase.from('books').update({ personal_notes: notes }).eq('id', currentBookId);
        
        if (error) showToast('নোট সেভ করা সম্ভব হয়নি।', 'error');
        else showToast('নোট সফলভাবে সেভ করা হয়েছে!');
        
        saveNotesBtn.disabled = false;
        saveNotesBtn.querySelector('.spinner').classList.add('hidden');
        saveNotesBtn.querySelector('.button-text').classList.remove('hidden');
    });
    
    // --- CORRECTED SECTION: Custom Shelves Toggle Logic ---
    customShelvesContainer.addEventListener('change', async (e) => {
        if (e.target.type !== 'checkbox') return;
        
        const checkbox = e.target;
        const shelfId = checkbox.dataset.shelfId;
        const isChecked = checkbox.checked;
        
        // 1. Disable checkbox to prevent double clicks
        checkbox.disabled = true;

        try {
            if (isChecked) {
                // 2. If CHECKED, perform INSERT operation
                const { error } = await _supabase.from('book_shelves').insert({ 
                    book_id: currentBookId, 
                    shelf_id: shelfId, 
                    user_id: currentUser.id 
                });

                if (error) {
                    // Throw error to be handled by the catch block
                    throw new Error(`শেলফে যোগ করতে সমস্যা হয়েছে: ${error.message}`);
                }
                showToast('বইটি শেলফে যোগ করা হয়েছে।');

            } else {
                // 2. If UNCHECKED, perform DELETE operation
                const { error } = await _supabase
                    .from('book_shelves')
                    .delete()
                    .eq('book_id', currentBookId)
                    .eq('shelf_id', shelfId);
                
                if (error) {
                    // Throw error to be handled by the catch block
                    throw new Error(`শেলফ থেকে সরাতে সমস্যা হয়েছে: ${error.message}`);
                }
                showToast('বইটি শেলফ থেকে সরানো হয়েছে।');
            }
        } catch (error) {
            // 3. Catch any errors from insert or delete
            console.error('Shelf operation failed:', error);
            showToast(error.message, 'error');
            // Revert the checkbox to its previous state on failure
            checkbox.checked = !isChecked;
        } finally {
            // 4. Re-enable the checkbox regardless of success or failure
            checkbox.disabled = false;
        }
    });

    loanStatusContainer.addEventListener('click', async (e) => {
        // Loan out a book
        if (e.target.id === 'loan-out-btn') {
            const borrowerName = prompt("আপনি কাকে বইটি ধার দিতে চান তার নাম লিখুন:");
            if (borrowerName && borrowerName.trim() !== "") {
                const { data, error } = await _supabase.from('loans').insert({
                    book_id: currentBookId,
                    user_id: currentUser.id,
                    borrower_name: borrowerName.trim(),
                    is_returned: false
                }).select().single();

                if (error) {
                    showToast('ধার দেওয়ার তথ্য সেভ করা যায়নি।', 'error');
                } else {
                    showToast(`বইটি ${borrowerName}-কে ধার দেওয়া হয়েছে।`);
                    renderLoanStatus(data);
                }
            }
        }
        // Mark as returned
        if (e.target.id === 'mark-as-returned-btn') {
            const loanId = e.target.dataset.loanId;
            const { error } = await _supabase.from('loans').update({ is_returned: true, returned_at: new Date() }).eq('id', loanId);
            if (error) {
                showToast('ফেরত হিসেবে চিহ্নিত করা যায়নি।', 'error');
            } else {
                showToast('বইটি সফলভাবে ফেরত নেওয়া হয়েছে।');
                renderLoanStatus(null);
            }
        }
    });
    
    addQuoteBtn.addEventListener('click', async () => {
        const quoteText = quoteTextInput.value.trim();
        const pageNumber = quotePageInput.value.trim();

        if (!quoteText) {
            showToast('অনুগ্রহ করে একটি উক্তি লিখুন।', 'error');
            return;
        }

        addQuoteBtn.disabled = true;
        const { data, error } = await _supabase.from('quotes').insert({
            book_id: currentBookId,
            user_id: currentUser.id,
            quote_text: quoteText,
            page_number: pageNumber || null
        }).select().single();

        if (error) {
            showToast('উক্তি যোগ করা সম্ভব হয়নি।', 'error');
        } else {
            showToast('উক্তি সফলভাবে যোগ করা হয়েছে!');
            quoteTextInput.value = '';
            quotePageInput.value = '';
            // Re-fetch all quotes to display the new one at the top
            const { data: quotes, error: quotesError } = await _supabase.from('quotes').select('*').eq('book_id', currentBookId).order('created_at', { ascending: false });
            if (!quotesError) {
                renderQuotes(quotes);
            }
        }
        addQuoteBtn.disabled = false;
    });
    
    quotesListContainer.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-quote-btn');
        if (!deleteButton) return;

        const quoteId = deleteButton.dataset.quoteId;
        if (confirm('আপনি কি নিশ্চিতভাবে এই উক্তিটি মুছে ফেলতে চান?')) {
            const { error } = await _supabase.from('quotes').delete().eq('id', quoteId);
            if (error) {
                showToast('উক্তিটি মোছা সম্ভব হয়নি।', 'error');
            } else {
                showToast('উক্তিটি সফলভাবে মুছে ফেলা হয়েছে।');
                // Remove the quote element directly from the DOM for instant feedback
                deleteButton.closest('.bg-white\\/80').remove();
                // Check if the list is now empty
                if (quotesListContainer.children.length === 0) {
                    renderQuotes([]); // Show the "no quotes" message
                }
            }
        }
    });

    deleteBookBtn.addEventListener('click', async () => {
        if (confirm('আপনি কি নিশ্চিতভাবে এই বইটি এবং এর সাথে সম্পর্কিত সমস্ত ডেটা (নোট, উক্তি, ধার) মুছে ফেলতে চান? এই কাজটি আর ফেরানো যাবে না।')) {
            deleteBookBtn.disabled = true;
            deleteBookBtn.querySelector('.spinner').classList.remove('hidden');
            deleteBookBtn.querySelector('.button-text').classList.add('hidden');
            
            try {
                // These operations should be done in a specific order to respect foreign key constraints if any.
                await _supabase.from('book_shelves').delete().eq('book_id', currentBookId);
                await _supabase.from('quotes').delete().eq('book_id', currentBookId);
                await _supabase.from('loans').delete().eq('book_id', currentBookId);
                
                // Finally, delete the book itself
                const { error: bookError } = await _supabase.from('books').delete().eq('id', currentBookId);
                if (bookError) throw bookError;

                showToast('বইটি সফলভাবে মুছে ফেলা হয়েছে।');
                window.location.replace('./dashboard.html');
            } catch (error) {
                console.error("Deletion error:", error);
                showToast('বইটি মোছা সম্ভব হয়নি। কিছু সম্পর্কিত ডেটা রয়ে যেতে পারে।', 'error');
                deleteBookBtn.disabled = false;
                deleteBookBtn.querySelector('.spinner').classList.add('hidden');
                deleteBookBtn.querySelector('.button-text').classList.remove('hidden');
            }
        }
    });

    // --- Page Initialization ---
    const initializePage = async () => {
        const params = new URLSearchParams(window.location.search);
        currentBookId = params.get('id');
        if (!currentBookId) {
            showToast('কোনো বই নির্দিষ্ট করা হয়নি।', 'error');
            window.location.replace('./dashboard.html');
            return;
        }

        const { data: { user } } = await _supabase.auth.getUser();
        if (user) {
            currentUser = user;
            await fetchBookDetails(currentBookId);
        } else {
            showToast('আপনাকে প্রথমে লগইন করতে হবে।', 'error');
            window.location.replace('./login.html');
        }
    };

    initializePage();
});
