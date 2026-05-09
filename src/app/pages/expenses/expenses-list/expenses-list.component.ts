import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-expenses-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.scss']
})
export class ExpensesListComponent {

  constructor(private http: HttpClient) { }

  activeTab = 'all';
  searchText = '';
  selectedCategoryFilter = '';
  currentPage = 1;
  itemsPerPage = 10;

  selectedCategory = '';
  categoryInput = '';

  showForm = false;
  showDropdown = false;
  showPaymentFields = false;

  // Edit Mode
  isEditMode: boolean = false;
  editExpenseId: number | null = null;

  // 🔥 User ID
  userId: number = 1;

  paymentTypes = [
    'UPI',
    'Cash',
    'Card',
    'Net Banking',
    'Cheque',
    'EMI'
  ];

  expense = {
    amount: '',
    expense_date: '',
    category: '',
    notes: '',
    mode: '',
    status: '',
    payment_date: ''
  };

  files: File[] = [];
  categoryList: any[] = [];
  baseData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  ngOnInit() {
    this.filteredData = [...this.baseData];
    this.updatePaginatedData();
    this.getExpenses();
    this.getCategories();
  }

  //--------------------------------
  // PAYMENT
  //--------------------------------
  togglePaymentFields() {
    this.showPaymentFields = !this.showPaymentFields;

    if (!this.showPaymentFields) {
      this.expense.mode = '';
      this.expense.payment_date = '';
    }
  }

  selectPaymentType(type: string) {
    this.expense.mode = type;
  }

  getPaidAmount() {
    return this.baseData
      .filter(item => item.status === 'paid')
      .reduce((total, item) => total + Number(item.amount), 0);
  }

  getPendingAmount() {
    return this.baseData
      .filter(item => item.status === 'pending')
      .reduce((total, item) => total + Number(item.amount), 0);
  }

  //--------------------------------
  // CATEGORY API - FIXED WORKING VERSION
  //--------------------------------
  getCategories() {
    console.log("🟢 Fetching categories for user_id:", this.userId);
    
    // Using fetch for better debugging
    fetch(`https://billsezy.com/Api/get-expense-categories.php?user_id=${this.userId}`)
      .then(res => {
        console.log("📡 Response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(res => {
        console.log("📦 API Response:", res);
        
        if (res.status === true && Array.isArray(res.data)) {
          this.categoryList = res.data;
          console.log("✅ Categories loaded:", this.categoryList.length);
        } else if (Array.isArray(res)) {
          this.categoryList = res;
          console.log("✅ Categories loaded (array):", this.categoryList.length);
        } else {
          // Fallback sample categories for testing
          this.categoryList = [
            { id: 1, name: 'Food & Dining' },
            { id: 2, name: 'Travel' },
            { id: 3, name: 'Utilities' },
            { id: 4, name: 'Rent' },
            { id: 5, name: 'Office Supplies' },
            { id: 6, name: 'Entertainment' },
            { id: 7, name: 'Transportation' },
            { id: 8, name: 'Healthcare' }
          ];
          console.log("📋 Using sample categories:", this.categoryList);
        }
      })
      .catch(err => {
        console.error("❌ Fetch error:", err);
        // Set sample categories if API fails
        this.categoryList = [
          { id: 1, name: 'Food & Dining' },
          { id: 2, name: 'Travel' },
          { id: 3, name: 'Utilities' },
          { id: 4, name: 'Rent' },
          { id: 5, name: 'Office Supplies' },
          { id: 6, name: 'Entertainment' },
          { id: 7, name: 'Transportation' },
          { id: 8, name: 'Healthcare' }
        ];
      });
  }

  addCategory(name: string) {
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    const payload = {
      name: name.trim(),
      user_id: this.userId
    };
    
    console.log("🟢 Adding category:", payload);

    fetch('https://billsezy.com/Api/add-expense-category.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        console.log("📦 Add Response:", res);
        
        if (res.status === true) {
          // Add to existing list immediately
          const newCategory = {
            id: res.category_id || Date.now(),
            name: name.trim(),
            user_id: this.userId
          };
          
          this.categoryList = [...this.categoryList, newCategory];
          console.log("✅ Category added, list size:", this.categoryList.length);
          
          // Set selected category
          this.expense.category = name.trim();
          this.selectedCategory = name.trim();
          this.categoryInput = '';
          this.showDropdown = false;
          
          alert('Category added successfully ✅');
        } else {
          alert(res.message || 'Failed to add category');
        }
      })
      .catch(err => {
        console.error("❌ Add error:", err);
        alert('Server Error ❌');
      });
  }

  //--------------------------------
  // FORM
  //--------------------------------
  openForm(expense?: any) {
    if (expense) {
      this.isEditMode = true;
      this.editExpenseId = expense.id;

      this.expense = {
        amount: expense.amount || '',
        expense_date: expense.expense_date || '',
        category: expense.category || '',
        notes: expense.notes || '',
        mode: expense.mode || '',
        status: expense.status || '',
        payment_date: expense.payment_date || ''
      };

      this.selectedCategory = expense.category || '';
      this.showPaymentFields = expense.status === 'paid';

    } else {
      this.isEditMode = false;
      this.editExpenseId = null;
      this.resetForm();
    }

    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.editExpenseId = null;
    this.resetForm();
  }

  resetForm() {
    this.expense = {
      amount: '',
      expense_date: '',
      category: '',
      notes: '',
      mode: '',
      status: '',
      payment_date: ''
    };
    this.selectedCategory = '';
    this.categoryInput = '';
    this.files = [];
    this.showPaymentFields = false;
    this.showDropdown = false;
  }

  onFileSelect(event: any) {
    const selectedFiles: FileList = event.target.files;
    if (selectedFiles) {
      this.files = Array.from(selectedFiles);
    }
  }

  //--------------------------------
  // GET EXPENSES
  //--------------------------------
  getExpenses() {
    this.http.get<any>(`https://billsezy.com/Api/get_expense.php?user_id=${this.userId}`)
      .subscribe({
        next: (res) => {
          if (res.status && Array.isArray(res.data)) {
            this.baseData = res.data.map((item: any) => ({
              id: item.id,
              amount: item.amount,
              status: item.status,
              mode: item.mode,
              expense_date: item.expense_date,
              category: item.category,
              notes: item.notes,
              payment_date: item.payment_date
            }));
            this.applyFilters();
          }
        },
        error: (err) => {
          console.log('Expense fetch error:', err);
        }
      });
  }

  //--------------------------------
  // ADD/UPDATE EXPENSE
  //--------------------------------
  addExpense() {
    if (!this.expense.amount || !this.expense.category) {
      alert('Please fill all required fields');
      return;
    }

    if (this.isEditMode && this.editExpenseId) {
      this.updateExpense();
    } else {
      this.createExpense();
    }
  }

  createExpense() {
    const payload = {
      user_id: this.userId,
      amount: this.expense.amount,
      expense_date: this.expense.expense_date,
      category: this.expense.category,
      notes: this.expense.notes,
      mode: this.expense.mode,
      payment_date: this.expense.payment_date,
      status: this.showPaymentFields ? 'paid' : 'pending'
    };

    this.http.post<any>('https://billsezy.com/Api/add_expense.php', payload)
      .subscribe({
        next: (res) => {
          if (res.status) {
            alert(res.message);
            this.getExpenses();
            this.resetForm();
            this.closeForm();
          } else {
            alert(res.message);
          }
        },
        error: (err) => {
          console.log('Add expense error:', err);
          alert('Server Error ❌');
        }
      });
  }

  updateExpense() {
    const payload = {
      id: this.editExpenseId,
      user_id: this.userId,
      amount: this.expense.amount,
      expense_date: this.expense.expense_date,
      category: this.expense.category,
      notes: this.expense.notes,
      mode: this.expense.mode,
      payment_date: this.expense.payment_date,
      status: this.showPaymentFields ? 'paid' : 'pending'
    };

    this.http.post<any>('https://billsezy.com/Api/update_expense.php', payload)
      .subscribe({
        next: (res) => {
          if (res.status) {
            alert(res.message);
            this.getExpenses();
            this.resetForm();
            this.closeForm();
          } else {
            alert(res.message);
          }
        },
        error: (err) => {
          console.log('Update expense error:', err);
          alert('Server Error ❌');
        }
      });
  }

  deleteExpense(id: number, category: string) {
    if (confirm(`Are you sure you want to delete this expense "${category}"?`)) {
      this.http.post<any>('https://billsezy.com/Api/delete_expense.php', {
        id: id,
        user_id: this.userId
      })
        .subscribe({
          next: (res) => {
            if (res.status) {
              alert('Expense deleted successfully ✅');
              this.getExpenses();
            } else {
              alert(res.message || 'Failed to delete expense');
            }
          },
          error: (err) => {
            console.log('Delete expense error:', err);
            alert('Server Error ❌');
          }
        });
    }
  }

  //--------------------------------
  // FILTERS
  //--------------------------------
  switchTab(type: string) {
    this.activeTab = type;
    this.applyFilters();
  }

  applyFilters() {
    let data = [...this.baseData];

    if (this.activeTab !== 'all') {
      data = data.filter(item => item.status === this.activeTab);
    }

    if (this.selectedCategoryFilter) {
      data = data.filter(item => item.category === this.selectedCategoryFilter);
    }

    if (this.searchText.trim()) {
      data = data.filter(item =>
        item.category?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.notes?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        item.mode?.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    this.filteredData = data;
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  searchExpense() {
    this.applyFilters();
  }

  //--------------------------------
  // PAGINATION
  //--------------------------------
  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  totalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage);
  }

  //--------------------------------
  // CATEGORY DROPDOWN
  //--------------------------------
  toggleDropdown(event: any) {
    this.showDropdown = !this.showDropdown;
    event.stopPropagation();
  }

  selectCategory(category: string, event: any) {
    this.expense.category = category;
    this.selectedCategory = category;
    this.showDropdown = false;
    event.stopPropagation();
  }

  addCategoryFromInput(event: any) {
    const categoryName = this.categoryInput.trim();

    if (!categoryName) {
      return;
    }

    // Check if category already exists
    const exists = this.categoryList.some(
      (cat) => cat.name?.toLowerCase() === categoryName.toLowerCase()
    );

    if (exists) {
      // Just select the existing category
      this.expense.category = categoryName;
      this.selectedCategory = categoryName;
      this.categoryInput = '';
      this.showDropdown = false;
      alert('Category already exists, selected it.');
    } else {
      // Add new category
      this.addCategory(categoryName);
    }

    event.stopPropagation();
  }
}