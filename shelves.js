// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const createShelfForm = document.getElementById('create-shelf-form');
    const shelfNameInput = document.getElementById('shelf-name-input');
    const createShelfButton = document.getElementById('create-shelf-button');
    const shelvesGridContainer = document.getElementById('shelves-grid-container');
    const emptyStateMessage = document.getElementById('empty-state-message');
    const loadingState = document.getElementById('loading-state');

    let currentUser = null;

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {boolean} isError - If true, displays an error-styled toast.
     */
    const showToast = (message, isError = false) => {
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                background: isError ? "linear-gradient(to right, #ef4444, #b91c1c)" : "linear-gradient(to right, #2563eb, #1d4ed8)",
            },
        }).showToast();
    };

    /**
     * Toggles the loading state of a button.
     * @param {HTMLButtonElement} button - The button element.
     * @param {boolean} isLoading - The loading state.
     */
    const setButtonLoading = (button, isLoading) => {
        const buttonText = button.querySelector('.button-text');
        const buttonLoader = button.querySelector('.button-loader');
        if (isLoading) {
            button.disabled = true;
            buttonText.classList.add('hidden');
            buttonLoader.classList.remove('hidden');
        } else {
            button.disabled = false;
            buttonText.classList.remove('hidden');
            buttonLoader.classList.add('hidden');
        }
    };

    /**
     * Creates an HTML card element for a single shelf.
     * @param {object} shelf - The shelf object from the database.
     * @returns {HTMLElement} - The created shelf card element.
     */
    const createShelfCard = (shelf) => {
        const card = document.createElement('div');
        card.className = "bg-white p-5 rounded-lg shadow-lg flex flex-col justify-between transition-transform transform hover:-translate-y-1";
        card.innerHTML = `
            <div>
                <h3 class="text-xl font-bold text-gray-800 truncate">${shelf.name}</h3>
                <p class="text-gray-500 mt-1">${shelf.book_count} টি বই</p>
            </div>
            <div class="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button class="rename-btn text-sm font-semibold text-yellow-600 hover:text-yellow-800 transition-colors">নাম পরিবর্তন</button>
                <button class="delete-btn text-sm font-semibold text-red-600 hover:text-red-800 transition-colors">মুছে ফেলুন</button>
            </div>
        `;

        // Add event listeners for rename and delete buttons
        card.querySelector('.rename-btn').addEventListener('click', () => handleRename(shelf.id, shelf.name));
        card.querySelector('.delete-btn').addEventListener('click', () => handleDelete(shelf.id, shelf.name));

        return card;
    };

    /**
     * Fetches and displays all shelves for the current user.
     */
    const loadUserShelves = async () => {
        if (!currentUser) return;

        loadingState.classList.remove('hidden');
        emptyStateMessage.classList.add('hidden');
        shelvesGridContainer.innerHTML = '';

        try {
            // Fetch all shelves for the current user, ordered by name
            const { data: shelves, error } = await _supabase
                .from('custom_shelves')
                .select('id, name')
                .eq('user_id', currentUser.id)
                .order('name', { ascending: true });

            if (error) throw error;

            // Handle the case where there are no shelves
            if (!shelves || shelves.length === 0) {
                emptyStateMessage.classList.remove('hidden');
                return;
            }

            // For each shelf, fetch the count of books associated with it
            const shelvesWithCountsPromises = shelves.map(async (shelf) => {
                const { count, error: countError } = await _supabase
                    .from('book_shelves')
                    .select('*', { count: 'exact', head: true })
                    .eq('shelf_id', shelf.id);
                
                if (countError) {
                    console.error(`Error counting books for shelf ${shelf.name}:`, countError);
                    return { ...shelf, book_count: 0 };
                }
                return { ...shelf, book_count: count || 0 };
            });

            const shelvesWithCounts = await Promise.all(shelvesWithCountsPromises);

            // Create and append a card for each shelf
            shelvesWithCounts.forEach(shelf => {
                const shelfCard = createShelfCard(shelf);
                shelvesGridContainer.appendChild(shelfCard);
            });

        } catch (error) {
            console.error("Error loading shelves:", error);
            showToast("শেলফ লোড করতে একটি সমস্যা হয়েছে।", true);
        } finally {
            loadingState.classList.add('hidden');
        }
    };

    /**
     * Handles the creation of a new shelf.
     * @param {Event} e - The form submission event.
     */
    const handleCreateShelf = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const newName = shelfNameInput.value.trim();
        if (!newName) {
            showToast("শেলফের একটি নাম দিন।", true);
            return;
        }

        setButtonLoading(createShelfButton, true);

        try {
            const { error } = await _supabase
                .from('custom_shelves')
                .insert([{ name: newName, user_id: currentUser.id }]);

            if (error) throw error;

            showToast("শেলফ সফলভাবে তৈরি হয়েছে।");
            shelfNameInput.value = ''; // Clear input field
            await loadUserShelves(); // Refresh the list

        } catch (error) {
            console.error("Error creating shelf:", error);
            // Handle unique constraint violation
            if (error.code === '23505') {
                 showToast("এই নামে ইতিমধ্যে একটি শেলফ রয়েছে।", true);
            } else {
                 showToast("শেলফ তৈরি করতে একটি সমস্যা হয়েছে।", true);
            }
        } finally {
            setButtonLoading(createShelfButton, false);
        }
    };

    /**
     * Handles renaming a shelf.
     * @param {number} shelfId - The ID of the shelf to rename.
     * @param {string} currentName - The current name of the shelf.
     */
    const handleRename = async (shelfId, currentName) => {
        const newName = prompt("শেলফের নতুন নাম দিন:", currentName);

        if (!newName || newName.trim() === '' || newName.trim() === currentName) {
            return; // User cancelled or entered the same/empty name
        }

        try {
            const { error } = await _supabase
                .from('custom_shelves')
                .update({ name: newName.trim() })
                .eq('id', shelfId)
                .eq('user_id', currentUser.id);

            if (error) throw error;
            
            showToast("শেলফের নাম সফলভাবে পরিবর্তন হয়েছে।");
            await loadUserShelves();

        } catch (error) {
            console.error("Error renaming shelf:", error);
            if (error.code === '23505') {
                 showToast("এই নামে ইতিমধ্যে একটি শেলফ রয়েছে।", true);
            } else {
                showToast("নাম পরিবর্তন করতে একটি সমস্যা হয়েছে।", true);
            }
        }
    };

    /**
     * Handles deleting a shelf after confirmation.
     * @param {number} shelfId - The ID of the shelf to delete.
     * @param {string} shelfName - The name of the shelf for the confirmation message.
     */
    const handleDelete = async (shelfId, shelfName) => {
        const isConfirmed = confirm(`আপনি কি নিশ্চিতভাবে "${shelfName}" শেলফটি মুছে ফেলতে চান?\n\nএই কাজটি বাতিল করা যাবে না।`);

        if (!isConfirmed) return;

        try {
            // First, delete all entries from the junction table 'book_shelves'
            // This is crucial to avoid foreign key constraint violations.
            const { error: junctionError } = await _supabase
                .from('book_shelves')
                .delete()
                .eq('shelf_id', shelfId);
            
            if (junctionError) throw junctionError;

            // After clearing the junction table, delete the shelf itself.
            const { error: shelfError } = await _supabase
                .from('custom_shelves')
                .delete()
                .eq('id', shelfId)
                .eq('user_id', currentUser.id);
            
            if (shelfError) throw shelfError;

            showToast(`"${shelfName}" শেলফটি সফলভাবে মুছে ফেলা হয়েছে।`);
            await loadUserShelves();

        } catch (error) {
            console.error("Error deleting shelf:", error);
            showToast("শেলফটি মুছতে একটি সমস্যা হয়েছে।", true);
        }
    };

    /**
     * Initializes the page, checks for a user session, and loads data.
     */
    const initializePage = async () => {
        // Check for user session using Supabase auth helper
        const { data: { session }, error } = await _supabase.auth.getSession();
        
        if (error) {
            console.error("Authentication error:", error);
            window.location.href = 'login.html';
            return;
        }

        if (!session) {
            // If no session, redirect to login
            console.log("No user session found. Redirecting to login.");
            window.location.href = 'login.html';
        } else {
            // If session exists, set the user and load their shelves
            currentUser = session.user;
            await loadUserShelves();
            // Add the form submission listener only after confirming user is logged in
            createShelfForm.addEventListener('submit', handleCreateShelf);
        }
    };

    // --- Script Entry Point ---
    initializePage();
});
