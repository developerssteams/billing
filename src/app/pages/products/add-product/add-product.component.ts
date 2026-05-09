import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-products-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent {

  // 🔹 Search
  searchText = '';

  // 🔹 Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // 🔹 Product Data
  productData: any[] = [];
  filteredData: any[] = [];
  paginatedData: any[] = [];

  // 🔹 Category Dropdown
  categoryList: any[] = [];
  selectedCategory: string = '';
  showDropdown = false;
  categoryInput: string = '';
  selectedCategoryFilter: string = '';

  // 🔹 User ID
  userId: number = 1;

  // 🔹 GST Rate List
  gstRateList: any[] = [
    { id: 1, name: '0% (Nil Rated)', value: 0 },
    { id: 2, name: '5%', value: 5 },
    { id: 3, name: '12%', value: 12 },
    { id: 4, name: '18%', value: 18 },
    { id: 5, name: '28%', value: 28 }
  ];

  // 🔹 Edit Mode
  isEditMode: boolean = false;
  editProductId: number | null = null;

  // 🔹 Form Toggle
  showForm = false;

  openForm(product?: any) {
    if (product) {
      this.isEditMode = true;
      this.editProductId = product.id;

      this.newProduct = {
        name: product.name || '',
        sell: product.sell || '',
        unit: product.unit || '',
        hsn: product.hsn || '',
        purchase: product.purchase || '',
        taxType: product.taxType || 'with',
        category: product.category || '',
        gstRate: product.gstRate || ''
      };

      this.selectedCategory = product.category || '';

    } else {
      this.isEditMode = false;
      this.editProductId = null;
      this.resetForm();
    }

    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.isEditMode = false;
    this.editProductId = null;
    this.resetForm();
  }

  resetForm() {
    this.newProduct = {
      name: '',
      sell: '',
      unit: '',
      hsn: '',
      purchase: '',
      taxType: 'with',
      category: '',
      gstRate: ''
    };
    this.selectedCategory = '';
    this.categoryInput = '';
    this.showDropdown = false;
  }

  applyFilters() {
    this.filteredData = this.productData.filter(item => {
      const matchSearch =
        item.name?.toLowerCase().includes(this.searchText.toLowerCase());

      const matchCategory =
        !this.selectedCategoryFilter ||
        item.category === this.selectedCategoryFilter;

      return matchSearch && matchCategory;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  newProduct: any = {
    name: '',
    sell: '',
    unit: '',
    hsn: '',
    purchase: '',
    taxType: 'with',
    category: '',
    gstRate: ''
  };

  ngOnInit() {
    this.getProducts();
    this.getCategories();
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOutside(event: any) {
    const dropdown = document.querySelector('.cat-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
      this.showDropdown = false;
      const dropdownElem = document.querySelector('.cat-dropdown');
      if (dropdownElem) {
        dropdownElem.classList.remove('open');
      }
    }
  }

  searchProduct() {
    this.filteredData = this.productData.filter(item =>
      item.name?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      item.category?.toLowerCase().includes(this.searchText.toLowerCase())
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  totalPages() {
    return Math.ceil(this.filteredData.length / this.itemsPerPage) || 1;
  }

  // =========================
  // 🔥 CATEGORY DROPDOWN WITH POSITION DETECTION
  // =========================
  // Update toggleDropdown method
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      setTimeout(() => {
        this.checkDropdownPosition();
      }, 10);
    }
  }
  dropdownUpward: boolean = false;
  // 🔥 Check if dropdown should open upward or downward
  // Add this method to check position
  checkDropdownPosition() {
    const dropdown = document.querySelector('.cat-dropdown');
    const menu = document.querySelector('.cat-dropdown-menu');

    if (dropdown && menu) {
      const rect = dropdown.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 260;

      this.dropdownUpward = spaceBelow < menuHeight;
    }
  }

  selectCategory(name: string, event: Event) {
    event.stopPropagation();
    this.selectedCategory = name;
    this.newProduct.category = name;
    this.showDropdown = false;

    const dropdown = document.querySelector('.cat-dropdown');
    if (dropdown) {
      dropdown.classList.remove('open');
    }
  }

  // =========================
  // 🔥 FETCH CATEGORIES
  // =========================
  getCategories() {
    console.log("Fetching categories from get_category.php for user_id:", this.userId);

    fetch(`https://billsezy.com/Api/get_category.php?user_id=${this.userId}`)
      .then(res => res.json())
      .then(res => {
        console.log("Categories API Response:", res);

        if (res.status === true) {
          this.categoryList = res.data || [];
          console.log("Categories loaded:", this.categoryList.length);
        } else {
          console.error("Failed to load categories:", res.message);
          this.categoryList = [];
        }
      })
      .catch(err => {
        console.error("API ERROR:", err);
        this.categoryList = [];
      });
  }

  // =========================
  // 🔥 ADD CATEGORY
  // =========================
  addCategoryFromInput(event?: Event) {
    if (event) event.stopPropagation();

    const name = this.categoryInput.trim();
    if (!name) return;

    const exists = this.categoryList.find(
      c => c.name?.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      this.selectedCategory = exists.name;
      this.newProduct.category = exists.name;
      this.categoryInput = '';
      this.showDropdown = false;
      return;
    }

    const payload = {
      name: name,
      user_id: this.userId
    };

    console.log("Adding category:", payload);

    fetch('https://billsezy.com/Api/add_category.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        console.log("Add Category Response:", res);

        if (res.status === true) {
          this.getCategories();
          this.selectedCategory = name;
          this.newProduct.category = name;
          this.categoryInput = '';
          this.showDropdown = false;
          alert('Category added successfully ✅');
        } else {
          alert(res.message || 'Failed to add category');
        }
      })
      .catch(err => {
        console.error("Error adding category:", err);
        alert('Server Error ❌');
      });
  }

  // =========================
  // 🔥 ADD/UPDATE PRODUCT
  // =========================
  isLoading = false;

  addProduct() {
    if (!this.newProduct.name) {
      alert('Product Name required');
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    if (this.isEditMode && this.editProductId) {
      this.updateProduct();
    } else {
      this.createProduct();
    }
  }

  createProduct() {
    const payload = {
      ...this.newProduct,
      user_id: this.userId
    };

    fetch('https://billsezy.com/Api/add_product.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getProducts();
          this.resetForm();
          this.closeForm();
          alert('Product Added Successfully ✅');
        } else {
          alert(res.message || 'Insert Failed ❌');
        }
      })
      .catch(err => {
        this.isLoading = false;
        console.error(err);
        alert('Server Error ❌');
      });
  }

  updateProduct() {
    const payload = {
      id: this.editProductId,
      ...this.newProduct,
      user_id: this.userId
    };

    fetch('https://billsezy.com/Api/update_product.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(res => {
        this.isLoading = false;
        if (res.status === true) {
          this.getProducts();
          this.resetForm();
          this.closeForm();
          alert('Product Updated Successfully ✅');
        } else {
          alert(res.message || 'Update Failed ❌');
        }
      })
      .catch(err => {
        this.isLoading = false;
        console.error(err);
        alert('Server Error ❌');
      });
  }

  deleteProduct(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      fetch('https://billsezy.com/Api/delete_product.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, user_id: this.userId })
      })
        .then(res => res.json())
        .then(res => {
          if (res.status === true) {
            this.getProducts();
            alert('Product deleted successfully ✅');
          } else {
            alert(res.message || 'Failed to delete product');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('Server Error ❌');
        });
    }
  }

  getProducts() {
    fetch(`https://billsezy.com/Api/get_product.php?user_id=${this.userId}`)
      .then(res => res.json())
      .then(res => {
        if (res.status === true) {
          this.productData = res.data || [];
          this.filteredData = [...this.productData];
          this.currentPage = 1;
          this.updatePagination();
        }
      })
      .catch(err => console.error(err));
  }

  // =========================
  // 🔥 WINDOW RESIZE - Recheck dropdown position
  // =========================
  @HostListener('window:resize')
  onWindowResize() {
    if (this.showDropdown) {
      this.checkDropdownPosition();
    }
  }

  // =========================
  // 🔥 SCROLL EVENT - Recheck dropdown position
  // =========================
  @HostListener('window:scroll')
  onWindowScroll() {
    if (this.showDropdown) {
      this.checkDropdownPosition();
    }
  }
}