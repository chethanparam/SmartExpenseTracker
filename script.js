// Main application state
const app = {
    currentPage: 'dashboard',
    currentPeriod: new Date(),
    darkMode: localStorage.getItem('darkMode') === 'true',
    transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
    budgets: JSON.parse(localStorage.getItem('budgets') || '[]'),
    pagination: {
        transactionsPerPage: 10,
        currentPage: 1
    },
    confirmCallback: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    renderAll();
    
    // Set up logo click handler
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            window.location.reload(); // Reload the page
        });
    }
    
    // Set up confirmation modal
    setupConfirmationModal();
});

// Initialize application components
function initApp() {
    setupNavigation();
    setupThemeToggle();
    setupDateNavigation();
    setupAddButtons();
    setupModalClosers();
    setupFilterHandlers();
    initializeForms();
    applyTheme();
}

// Set up sidebar navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const page = link.getAttribute('data-page');
            changePage(page);
        });
    });

    // Handle "View All" links
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            changePage(target);
        });
    });
}

// Change active page
function changePage(pageName) {
    // Update active class in navigation
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // Hide all pages and show the selected one
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
    
    // Update app state
    app.currentPage = pageName;
    
    // Reset pagination when switching to transactions page
    if (pageName === 'transactions') {
        app.pagination.currentPage = 1;
        renderTransactionsTable();
    }
}

// Set up theme toggle
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        app.darkMode = !app.darkMode;
        localStorage.setItem('darkMode', app.darkMode);
        applyTheme();
    });
}

// Apply current theme
function applyTheme() {
    document.body.classList.toggle('dark-theme', app.darkMode);
    const themeIcon = document.querySelector('#theme-toggle i');
    const themeText = document.querySelector('#theme-toggle');
    
    if (app.darkMode) {
        themeIcon.className = 'fas fa-sun';
        themeText.innerHTML = '<i class="fas fa-sun"></i>Light Mode';
    } else {
        themeIcon.className = 'fas fa-moon';
        themeText.innerHTML = '<i class="fas fa-moon"></i>Dark Mode';
    }
}

// Set up date navigation
function setupDateNavigation() {
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    prevMonthBtn.addEventListener('click', () => {
        app.currentPeriod.setMonth(app.currentPeriod.getMonth() - 1);
        updateCurrentPeriodDisplay();
        renderAll();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        const now = new Date();
        const nextMonth = new Date(app.currentPeriod);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // Only allow navigation if next month is not in the future
        if (nextMonth <= now) {
            app.currentPeriod = nextMonth;
            updateCurrentPeriodDisplay();
            renderAll();
        }
    });
    
    updateCurrentPeriodDisplay(); // Initialize button state
}

// Update the period display
function updateCurrentPeriodDisplay() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
                    'August', 'September', 'October', 'November', 'December'];
    const month = months[app.currentPeriod.getMonth()];
    const year = app.currentPeriod.getFullYear();
    
    document.getElementById('current-period').textContent = `${month} ${year}`;
    
    // Disable "next-month" button if next month is in the future
    const now = new Date();
    const nextMonth = new Date(app.currentPeriod);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const nextMonthBtn = document.getElementById('next-month');
    nextMonthBtn.disabled = nextMonth > now;
}

// Set up add buttons
function setupAddButtons() {
    // Add Transaction button
    const addTransactionBtn = document.getElementById('add-transaction');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            openTransactionModal();
        });
    }
    
    // Add Budget button
    const addBudgetBtn = document.getElementById('add-budget');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', () => {
            openBudgetModal();
        });
    }
}

// Modal handlers
function setupModalClosers() {
    // Close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Cancel buttons
    const cancelTransaction = document.getElementById('cancel-transaction');
    if (cancelTransaction) {
        cancelTransaction.addEventListener('click', closeAllModals);
    }
    
    const cancelBudget = document.getElementById('cancel-budget');
    if (cancelBudget) {
        cancelBudget.addEventListener('click', closeAllModals);
    }
    
    // Close when clicking outside modal
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
}

// Close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
        modal.classList.remove('active');
    });
}

// Open transaction modal
function openTransactionModal(transaction = null) {
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    const modalTitle = document.getElementById('modal-title');
    
    form.reset();
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('transaction-date');
    dateInput.value = today;
    dateInput.max = today;
    
    if (transaction) {
        // Editing existing transaction
        modalTitle.textContent = 'Edit Transaction';
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-amount').value = Math.abs(transaction.amount);
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-category').value = transaction.category;
        document.getElementById('transaction-notes').value = transaction.notes || '';
        
        // Set transaction type
        if (transaction.amount > 0) {
            document.getElementById('type-income').checked = true;
        } else {
            document.getElementById('type-expense').checked = true;
        }
        
        // Update category options based on type
        updateCategoryOptions(transaction.amount > 0 ? 'income' : 'expense');
    } else {
        // New transaction
        modalTitle.textContent = 'Add Transaction';
        document.getElementById('transaction-id').value = '';
        
        // Default to expense type
        document.getElementById('type-expense').checked = true;
        updateCategoryOptions('expense');
    }
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
    modal.classList.add('active');
    }, 10);
}

// Open budget modal
function openBudgetModal(budget = null) {
    const modal = document.getElementById('budget-modal');
    const form = document.getElementById('budget-form');
    const modalTitle = document.getElementById('budget-modal-title');
    
    form.reset();
    
    if (budget) {
        // Editing existing budget
        modalTitle.textContent = 'Edit Budget';
        document.getElementById('budget-id').value = budget.id;
        document.getElementById('budget-category').value = budget.category;
        document.getElementById('budget-amount').value = budget.amount;
    } else {
        // New budget
        modalTitle.textContent = 'Create Budget';
        document.getElementById('budget-id').value = '';
    }
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
    modal.classList.add('active');
    }, 10);
}

// Initialize form event listeners
function initializeForms() {
    // Transaction form
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveTransaction();
        });
        
        // Update categories when transaction type changes
        const typeRadios = document.querySelectorAll('input[name="transaction-type"]');
        typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                updateCategoryOptions(e.target.value);
            });
        });
    }

    // Budget form
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBudget();
        });
    }
}

// Update category options based on transaction type
function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('transaction-category');
    const incomeCategories = categorySelect.querySelector('optgroup[label="Income"]');
    const expenseCategories = categorySelect.querySelector('optgroup[label="Expenses"]');
    
    if (type === 'income') {
        incomeCategories.querySelectorAll('option')[0].selected = true;
        incomeCategories.style.display = '';
        expenseCategories.style.display = 'none';
    } else {
        expenseCategories.querySelectorAll('option')[0].selected = true;
        expenseCategories.style.display = '';
        incomeCategories.style.display = 'none';
    }
}

// Save transaction to local storage
function saveTransaction() {
    const form = document.getElementById('transaction-form');
    const id = document.getElementById('transaction-id').value;
    const date = document.getElementById('transaction-date').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value.trim();
    const category = document.getElementById('transaction-category').value;
    const notes = document.getElementById('transaction-notes').value.trim();
    const type = document.querySelector('input[name="transaction-type"]:checked').value;
    
    // Format amount - negative for expenses, positive for income
    const formattedAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    
    const transaction = {
        id: id || generateId(),
        date,
        amount: formattedAmount,
        description,
        category,
        notes
    };
    
    // Update existing or add new
    if (id) {
        const index = app.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            app.transactions[index] = transaction;
        }
    } else {
        app.transactions.push(transaction);
    }
    
    // Sort transactions by date (newest first)
    app.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Save to localStorage
    localStorage.setItem('transactions', JSON.stringify(app.transactions));
    
    // Close modal and re-render
    closeAllModals();
    renderAll();
}

// Save budget to local storage
function saveBudget() {
    const form = document.getElementById('budget-form');
    const id = document.getElementById('budget-id').value;
    const category = document.getElementById('budget-category').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    
    const budget = {
        id: id || generateId(),
        category,
        amount
    };
    
    // Update existing or add new
    if (id) {
        const index = app.budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            app.budgets[index] = budget;
        }
    } else {
        // Check if a budget for this category already exists
        const existingIndex = app.budgets.findIndex(b => b.category === category);
        if (existingIndex !== -1) {
            app.budgets[existingIndex] = budget;
        } else {
            app.budgets.push(budget);
        }
    }
    
    // Save to localStorage
    localStorage.setItem('budgets', JSON.stringify(app.budgets));
    
    // Close modal and re-render
    closeAllModals();
    renderAll();
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Setup filter handlers for transactions
function setupFilterHandlers() {
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const searchInput = document.getElementById('transaction-search');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            renderTransactionsTable();
        });
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            renderTransactionsTable();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderTransactionsTable();
        });
    }
    
    // Pagination buttons
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
        if (app.pagination.currentPage > 1) {
            app.pagination.currentPage--;
            renderTransactionsTable();
        }
    });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const filteredTransactions = getFilteredTransactions();
            const totalPages = Math.ceil(filteredTransactions.length / app.pagination.transactionsPerPage);
            
        if (app.pagination.currentPage < totalPages) {
            app.pagination.currentPage++;
            renderTransactionsTable();
        }
    });
    }
}

// Get filtered transactions
function getFilteredTransactions() {
    const categoryFilter = document.getElementById('category-filter');
    const typeFilter = document.getElementById('type-filter');
    const searchInput = document.getElementById('transaction-search');
    
    return app.transactions.filter(transaction => {
        // Filter by category
        if (categoryFilter && categoryFilter.value !== 'all' && transaction.category !== categoryFilter.value) {
            return false;
        }
        
        // Filter by type (expense/income)
        if (typeFilter && typeFilter.value !== 'all') {
            if (typeFilter.value === 'expense' && transaction.amount >= 0) {
            return false;
        }
            if (typeFilter.value === 'income' && transaction.amount < 0) {
            return false;
            }
        }
        
        // Filter by search term
        if (searchInput && searchInput.value.trim() !== '') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            return transaction.description.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });
}

// Get current month transactions
function getCurrentMonthTransactions() {
    const year = app.currentPeriod.getFullYear();
    const month = app.currentPeriod.getMonth();
    
    return app.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
}

// Get previous month transactions
function getPreviousMonthTransactions() {
    const prevPeriod = new Date(app.currentPeriod);
    prevPeriod.setMonth(prevPeriod.getMonth() - 1);
    
    const year = prevPeriod.getFullYear();
    const month = prevPeriod.getMonth();
    
    return app.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
}

// Calculate financial summary
function calculateSummary() {
    const currentTransactions = getCurrentMonthTransactions();
    const previousTransactions = getPreviousMonthTransactions();
    
    // Current month summary
    const currentIncome = currentTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpenses = currentTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const currentBalance = currentIncome - currentExpenses;
    
    // Previous month summary
    const previousIncome = previousTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const previousExpenses = previousTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const previousBalance = previousIncome - previousExpenses;
    
    // Calculate month-over-month changes
    const incomeChange = previousIncome === 0 ? 0 : ((currentIncome - previousIncome) / previousIncome) * 100;
    const expenseChange = previousExpenses === 0 ? 0 : ((currentExpenses - previousExpenses) / previousExpenses) * 100;
    const balanceChange = previousBalance === 0 ? 0 : ((currentBalance - previousBalance) / Math.abs(previousBalance)) * 100;
    
    return {
        income: currentIncome,
        expenses: currentExpenses,
        balance: currentBalance,
        incomeChange,
        expenseChange,
        balanceChange
    };
}

// Format currency
function formatCurrency(amount) {
    const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
    if (amount > 0) {
        return '+' + formatted.substring(1); // Remove the first character (currency symbol) and add +
    } else if (amount < 0) {
        return '-' + formatted.substring(1); // Keep negative sign
    }
    return formatted;
}

// Render all components
function renderAll() {
    renderSummaryCards();
    renderCharts();
    renderRecentTransactions();
    renderTransactionsTable();
    renderBudgets();
}

// Render the summary cards
function renderSummaryCards() {
    const summary = calculateSummary();
    
    // Update the summary cards
    // For income and expense, use the absolute values without signs
    const incomeFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(summary.income));
    const expensesFormatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(summary.expenses));
    
    document.querySelector('.card.income .amount').textContent = incomeFormatted;
    document.querySelector('.card.expenses .amount').textContent = expensesFormatted;
    
    // Set balance with appropriate color class and +/- symbol
    const balanceEl = document.querySelector('.card.balance .amount');
    balanceEl.textContent = formatCurrency(summary.balance);
    balanceEl.className = 'amount ' + (summary.balance >= 0 ? 'positive' : 'negative');
    
    // Update change indicators
    const incomeChangeEl = document.querySelector('.card.income .change');
    incomeChangeEl.textContent = `${summary.incomeChange >= 0 ? '▲' : '▼'} ${Math.abs(summary.incomeChange).toFixed(1)}% from last month`;
    incomeChangeEl.className = `change ${summary.incomeChange >= 0 ? 'positive' : 'negative'}`;
    
    const expenseChangeEl = document.querySelector('.card.expenses .change');
    expenseChangeEl.textContent = `${summary.expenseChange >= 0 ? '▲' : '▼'} ${Math.abs(summary.expenseChange).toFixed(1)}% from last month`;
    // For expenses, an increase is negative and a decrease is positive
    expenseChangeEl.className = `change ${summary.expenseChange <= 0 ? 'positive' : 'negative'}`;
    
    const balanceChangeEl = document.querySelector('.card.balance .change');
    balanceChangeEl.textContent = `${summary.balanceChange >= 0 ? '▲' : '▼'} ${Math.abs(summary.balanceChange).toFixed(1)}% from last month`;
    balanceChangeEl.className = `change ${summary.balanceChange >= 0 ? 'positive' : 'negative'}`;
}

// Render all charts
function renderCharts() {
    renderIncomeExpenseChart();
    renderCategoryChart();
}

// Render the income vs expense chart
function renderIncomeExpenseChart() {
    const ctx = document.getElementById('income-expense-chart').getContext('2d');
    
    // Get the last 6 months of data
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    // Start from 5 months ago
    const startDate = new Date(app.currentPeriod);
    startDate.setMonth(startDate.getMonth() - 5);
    
    for (let i = 0; i < 6; i++) {
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        
        // Format month name
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.push(monthNames[month]);
        
        // Get transactions for this month
        const monthTransactions = app.transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });
        
        // Calculate income and expenses
        const income = monthTransactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = monthTransactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        incomeData.push(income);
        expenseData.push(expenses);
        
        // Move to next month
        startDate.setMonth(month + 1);
    }
    
    // Create or update chart
    if (window.incomeExpenseChart) {
        window.incomeExpenseChart.data.labels = months;
        window.incomeExpenseChart.data.datasets[0].data = incomeData;
        window.incomeExpenseChart.data.datasets[1].data = expenseData;
        window.incomeExpenseChart.update();
    } else {
    window.incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
                labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
    }
}

// Render the spending by category chart
function renderCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    // Get current month transactions
    const currentTransactions = getCurrentMonthTransactions();
    
    // Group expenses by category
    const expensesByCategory = {};
    
    currentTransactions.filter(t => t.amount < 0).forEach(transaction => {
        if (!expensesByCategory[transaction.category]) {
            expensesByCategory[transaction.category] = 0;
        }
        expensesByCategory[transaction.category] += Math.abs(transaction.amount);
    });
    
    // Prepare data for chart
    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);
    const backgroundColors = [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)'
    ];
    
    // Create or update chart
    if (window.categoryChart) {
        window.categoryChart.data.labels = categories.map(formatCategory);
        window.categoryChart.data.datasets[0].data = amounts;
        window.categoryChart.update();
    } else {
    window.categoryChart = new Chart(ctx, {
            type: 'doughnut',
        data: {
                labels: categories.map(formatCategory),
            datasets: [{
                    data: amounts,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                        position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += formatCurrency(context.raw);
                                return label;
                        }
                    }
                }
            }
        }
    });
    }
}

// Render recent transactions in the dashboard
function renderRecentTransactions() {
    const recentTransactionsList = document.getElementById('recent-transactions-list');
    if (!recentTransactionsList) return;
    
    // Get the 5 most recent transactions
    const recentTransactions = app.transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentTransactionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions yet. Click "Add Transaction" to get started.</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for transactions
    const transactionsHTML = recentTransactions.map(transaction => `
            <div class="transaction-item">
            <div class="transaction-details">
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${formatCategory(transaction.category)}</div>
                </div>
            <div class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(transaction.amount)}
                </div>
            </div>
    `).join('');
    
    recentTransactionsList.innerHTML = transactionsHTML;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format category for display
function formatCategory(category) {
    // Map internal category values to display names
    const categoryMap = {
        'food': 'Food & Dining',
        'shopping': 'Shopping',
        'housing': 'Housing',
        'transportation': 'Transportation',
        'entertainment': 'Entertainment',
        'healthcare': 'Healthcare',
        'education': 'Education',
        'salary': 'Salary',
        'freelance': 'Freelance',
        'investment': 'Investment',
        'gift': 'Gift',
        'other': 'Other',
        'other-income': 'Other Income'
    };
    
    return categoryMap[category] || category;
}

// Render transactions table
function renderTransactionsTable() {
    const tableBody = document.getElementById('transactions-table-body');
    const emptyState = document.getElementById('transactions-empty-state');
    
    if (!tableBody || !emptyState) return;
    
    const filteredTransactions = getFilteredTransactions();
    
    // Update pagination
    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / app.pagination.transactionsPerPage);
    
    // Ensure current page is valid
    if (app.pagination.currentPage > totalPages) {
        app.pagination.currentPage = Math.max(1, totalPages);
    }
    
    // Update pagination controls
    document.getElementById('prev-page').disabled = app.pagination.currentPage <= 1;
    document.getElementById('next-page').disabled = app.pagination.currentPage >= totalPages;
    document.getElementById('page-indicator').textContent = `Page ${app.pagination.currentPage} of ${totalPages || 1}`;
    
    // Show empty state if no transactions
    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    // Hide empty state
    emptyState.style.display = 'none';
    
    // Get the current page of transactions
    const startIndex = (app.pagination.currentPage - 1) * app.pagination.transactionsPerPage;
    const endIndex = startIndex + app.pagination.transactionsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Render transaction rows
    const rowsHTML = paginatedTransactions.map(transaction => `
        <tr>
                <td>${formatDate(transaction.date)}</td>
            <td>
                <div class="transaction-description-cell">
                    <span class="transaction-description">${transaction.description}</span>
                    ${transaction.notes ? `<span class="transaction-note">[${transaction.notes}]</span>` : ''}
                </div>
            </td>
                <td>${formatCategory(transaction.category)}</td>
            <td class="amount-cell ${transaction.amount >= 0 ? 'positive' : 'negative'}">${formatCurrency(transaction.amount)}</td>
            <td class="actions-cell">
                <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
    `).join('');

    tableBody.innerHTML = rowsHTML;

    // Add event listeners to edit and delete buttons
    tableBody.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            const transaction = app.transactions.find(t => t.id === transactionId);
            if (transaction) {
                openTransactionModal(transaction);
            }
        });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            const transactionId = button.getAttribute('data-id');
            showConfirmDialog('Delete Transaction', `Are you sure you want to delete this transaction?`, (confirmed) => {
                if (confirmed) {
                    app.transactions = app.transactions.filter(t => t.id !== transactionId);
                    localStorage.setItem('transactions', JSON.stringify(app.transactions));
                    renderAll();
                }
            });
        });
    });
}

// Render the budgets
function renderBudgets() {
    const budgetsList = document.getElementById('budgets-list');
    if (!budgetsList) return;
    
    // Get current month transactions for spending calculation
    const currentTransactions = getCurrentMonthTransactions();
    
    if (app.budgets.length === 0) {
        budgetsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-piggy-bank"></i>
                <p>No budgets yet. Click "Create Budget" to get started.</p>
            </div>
        `;
        return;
    }
    
    // Create HTML for budgets
    const budgetsHTML = app.budgets.map(budget => {
        // Calculate spending for this category
        const spending = currentTransactions
            .filter(t => t.amount < 0 && t.category === budget.category)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        // Calculate progress percentage
        const progress = Math.min(100, (spending / budget.amount) * 100);
        
        // Determine progress bar color
        let progressClass = 'progress-normal';
        if (progress >= 85) {
            progressClass = 'progress-danger';
        } else if (progress >= 70) {
            progressClass = 'progress-warning';
        }
        
        return `
            <div class="budget-card">
            <div class="budget-header">
                    <h3>${formatCategory(budget.category)}</h3>
                <div class="budget-actions">
                        <button class="edit-budget" data-id="${budget.id}"><i class="fas fa-edit"></i></button>
                        <button class="delete-budget" data-id="${budget.id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
                <div class="budget-amount-info">
                    <span class="spent-amount">${formatCurrency(spending)}</span> 
                    <span class="of">of</span> 
                    <span class="budget-amount">${formatCurrency(budget.amount)}</span>
                    </div>
                <div class="budget-progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${progress}%"></div>
                    </div>
                <div class="budget-status">
                    <span>${progress.toFixed(0)}% used</span>
                    <span class="remaining-budget">
                        ${formatCurrency(budget.amount - spending)} remaining
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    budgetsList.innerHTML = budgetsHTML;
    
    // Add event listeners to edit and delete buttons
    budgetsList.querySelectorAll('.edit-budget').forEach(button => {
        button.addEventListener('click', () => {
            const budgetId = button.getAttribute('data-id');
            const budget = app.budgets.find(b => b.id === budgetId);
            if (budget) {
                openBudgetModal(budget);
            }
        });
    });
    
    budgetsList.querySelectorAll('.delete-budget').forEach(button => {
        button.addEventListener('click', () => {
            const budgetId = button.getAttribute('data-id');
            showConfirmDialog('Delete Budget', `Are you sure you want to delete this budget?`, (confirmed) => {
                if (confirmed) {
                    app.budgets = app.budgets.filter(b => b.id !== budgetId);
                    localStorage.setItem('budgets', JSON.stringify(app.budgets));
                    renderAll();
                }
            });
        });
    });
}

// Setup confirmation modal
function setupConfirmationModal() {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmOkBtn = document.getElementById('confirm-ok');
    const confirmCancelBtn = document.getElementById('confirm-cancel');
    const closeBtn = confirmModal.querySelector('.close-modal');
    
    confirmOkBtn.addEventListener('click', () => {
        if (app.confirmCallback && typeof app.confirmCallback === 'function') {
            app.confirmCallback(true);
        }
        closeAllModals();
        app.confirmCallback = null;
    });
    
    confirmCancelBtn.addEventListener('click', () => {
        if (app.confirmCallback && typeof app.confirmCallback === 'function') {
            app.confirmCallback(false);
        }
        closeAllModals();
        app.confirmCallback = null;
    });
    
    closeBtn.addEventListener('click', () => {
        if (app.confirmCallback && typeof app.confirmCallback === 'function') {
            app.confirmCallback(false);
        }
        closeAllModals();
        app.confirmCallback = null;
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            if (app.confirmCallback && typeof app.confirmCallback === 'function') {
                app.confirmCallback(false);
            }
            closeAllModals();
            app.confirmCallback = null;
        }
    });
}

// Show confirmation dialog
function showConfirmDialog(title, message, callback) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    app.confirmCallback = callback;
    
    confirmModal.style.display = 'flex';
    setTimeout(() => {
        confirmModal.classList.add('active');
    }, 10);
}