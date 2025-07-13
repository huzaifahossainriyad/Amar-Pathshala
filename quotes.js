// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const quotesListContainer = document.querySelector('#quotes-list-container');
    const searchInput = document.querySelector('#search-input');
    const bookFilterSelect = document.querySelector('#book-filter-select');
    const loadingIndicator = document.querySelector('#loading-indicator');
    const emptyStateMessage = document.querySelector('#empty-state-message');
    const noResultsMessage = document.querySelector('#no-results-message');

    // Global state to hold all quotes fetched from the database
    let allQuotes = [];
    let currentUser = null;

    /**
     * Checks the authentication state of the user.
     * If logged in, initializes the page. Otherwise, redirects to login.
     */
    const checkUserSession = async () => {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            await loadUserQuotes();
        } else {
            // Redirect to login page if no user is signed in
            window.location.href = 'login.html';
        }
    };

    /**
     * Fetches quotes for the current user from the Supabase database.
     * This function performs a join to get book details along with the quotes.
     */
    const loadUserQuotes = async () => {
        showLoading(true);

        // Fetch quotes and related book data (title, author)
        const { data, error } = await _supabase
            .from('quotes')
            .select('id, quote_text, page_number, created_at, books (id, title, author)')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        showLoading(false);

        if (error) {
            console.error('Error fetching quotes:', error.message);
            showToast('উক্তি আনতে সমস্যা হয়েছে।', 'error');
            return;
        }

        allQuotes = data;

        if (allQuotes.length === 0) {
            // If the user has no quotes saved at all
            emptyStateMessage.classList.remove('hidden');
        } else {
            // If quotes are found, populate filter and display them
            populateBookFilter(allQuotes);
            displayQuotes(allQuotes);
        }
    };

    /**
     * Populates the book filter dropdown with unique books from the fetched quotes.
     * @param {Array} quotes - The array of quote objects.
     */
    const populateBookFilter = (quotes) => {
        // Use a Map to get a unique list of books by book ID
        const uniqueBooks = new Map();
        quotes.forEach(quote => {
            if (quote.books && !uniqueBooks.has(quote.books.id)) {
                uniqueBooks.set(quote.books.id, quote.books);
            }
        });

        // Clear previous options except the first one ("All Books")
        bookFilterSelect.innerHTML = '<option value="all">সব বই</option>';

        // Create and append new option elements for each unique book
        uniqueBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.title;
            bookFilterSelect.appendChild(option);
        });
    };

    /**
     * Renders the provided array of quotes into the DOM.
     * @param {Array} quotesToDisplay - The array of quote objects to display.
     */
    const displayQuotes = (quotesToDisplay) => {
        // Clear the container before rendering new quotes
        quotesListContainer.innerHTML = '';

        // Show a "no results" message if the filtered array is empty but the master array is not
        if (quotesToDisplay.length === 0 && allQuotes.length > 0) {
            noResultsMessage.classList.remove('hidden');
        } else {
            noResultsMessage.classList.add('hidden');
        }

        quotesToDisplay.forEach(quote => {
            // Default values if book data is missing (for data integrity)
            const bookTitle = quote.books ? quote.books.title : 'অজানা বই';
            const bookAuthor = quote.books ? quote.books.author : 'অজানা লেখক';
            const bookId = quote.books ? quote.books.id : '#';
            
            const card = document.createElement('div');
            card.className = 'bg-base-100 p-6 rounded-lg shadow-md flex flex-col justify-between transition-transform transform hover:-translate-y-1';
            card.setAttribute('data-quote-id', quote.id);

            card.innerHTML = `
                <div>
                    <blockquote class="text-lg italic border-l-4 border-primary pl-4 mb-4">
                        "${quote.quote_text}"
                    </blockquote>
                    <div class="text-sm text-gray-600 mt-4">
                        <p><strong>বই:</strong> <a href="book-details.html?id=${bookId}" class="hover:underline text-primary">${bookTitle}</a></p>
                        <p><strong>লেখক:</strong> ${bookAuthor}</p>
                        ${quote.page_number ? `<p><strong>পৃষ্ঠা নম্বর:</strong> ${quote.page_number}</p>` : ''}
                    </div>
                </div>
                <div class="text-right mt-4">
                    <button class="delete-quote-btn text-red-500 hover:text-red-700 font-semibold" data-quote-id="${quote.id}">
                        মুছে ফেলুন
                    </button>
                </div>
            `;
            quotesListContainer.appendChild(card);
        });

        // Add event listeners to the newly created delete buttons
        addDeleteButtonListeners();
    };

    /**
     * Handles the filtering and searching logic based on user input.
     */
    const handleFilterAndSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedBookId = bookFilterSelect.value;

        let filteredQuotes = allQuotes;

        // 1. Filter by the selected book
        if (selectedBookId !== 'all') {
            filteredQuotes = filteredQuotes.filter(quote => quote.books && quote.books.id == selectedBookId);
        }

        // 2. Filter by the search term
        if (searchTerm) {
            filteredQuotes = filteredQuotes.filter(quote => 
                quote.quote_text.toLowerCase().includes(searchTerm) ||
                (quote.books && quote.books.title.toLowerCase().includes(searchTerm))
            );
        }

        // Re-render the UI with the filtered quotes
        displayQuotes(filteredQuotes);
    };

    /**
     * Adds click event listeners to all delete buttons on the page.
     */
    const addDeleteButtonListeners = () => {
        const deleteButtons = document.querySelectorAll('.delete-quote-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', handleDeleteQuote);
        });
    };

    /**
     * Handles the quote deletion process.
     * @param {Event} e - The click event object.
     */
    const handleDeleteQuote = async (e) => {
        const quoteId = e.target.dataset.quoteId;

        // Confirm with the user before deleting
        if (!confirm('আপনি কি নিশ্চিতভাবে এই উক্তিটি মুছে ফেলতে চান?')) {
            return;
        }

        // Perform the delete operation in Supabase
        const { error } = await _supabase
            .from('quotes')
            .delete()
            .eq('id', quoteId);

        if (error) {
            console.error('Error deleting quote:', error.message);
            showToast('উক্তিটি মুছতে সমস্যা হয়েছে।', 'error');
        } else {
            // On successful deletion, update the UI
            showToast('উক্তি সফলভাবে মুছে ফেলা হয়েছে।', 'success');
            
            // Remove the quote from the global state
            allQuotes = allQuotes.filter(quote => quote.id != quoteId);
            
            // Re-run the filter and search to update the view
            handleFilterAndSearch();

            // If all quotes are deleted, show the empty state message
            if (allQuotes.length === 0) {
                emptyStateMessage.classList.remove('hidden');
                noResultsMessage.classList.add('hidden');
            }
        }
    };

    /**
     * Helper function to show or hide the loading indicator.
     * @param {boolean} isLoading - Whether to show the loader.
     */
    const showLoading = (isLoading) => {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            quotesListContainer.classList.add('hidden');
        } else {
            loadingIndicator.classList.add('hidden');
            quotesListContainer.classList.remove('hidden');
        }
    };

    // --- Event Listeners ---
    searchInput.addEventListener('input', handleFilterAndSearch);
    bookFilterSelect.addEventListener('change', handleFilterAndSearch);

    // --- Initial Load ---
    checkUserSession();
});
