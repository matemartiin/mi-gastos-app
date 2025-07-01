import { AuthManager } from './modules/auth.js';
import { DataManager } from './modules/data.js';
import { UIManager } from './modules/ui.js';
import { ChartManager } from './modules/charts.js';
import { ModalManager } from './modules/modals.js';
import { ChatManager } from './modules/chat.js';
import { ReportManager } from './modules/reports.js';
import { ThemeManager } from './modules/theme.js';

class FinznApp {
  constructor() {
    this.auth = new AuthManager();
    this.data = new DataManager();
    this.ui = new UIManager();
    this.charts = new ChartManager();
    this.modals = new ModalManager();
    this.chat = new ChatManager();
    this.reports = new ReportManager();
    this.theme = new ThemeManager();
    
    this.currentMonth = this.getCurrentMonth();
    this.init();
  }

  async init() {
    // Initialize theme first
    this.theme.init();
    
    // Check if user is already logged in
    const currentUser = this.auth.getCurrentUser();
    if (currentUser) {
      this.showApp();
      await this.loadUserData();
    } else {
      this.showAuth();
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auth events
    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('show-register').addEventListener('click', () => this.showRegister());
    document.getElementById('show-login').addEventListener('click', () => this.showLogin());

    // App events
    document.getElementById('month-select').addEventListener('change', (e) => this.handleMonthChange(e));
    document.getElementById('theme-toggle').addEventListener('click', () => this.theme.toggle());
    
    // Expense management
    document.getElementById('add-expense-btn').addEventListener('click', () => this.modals.show('expense-modal'));
    document.getElementById('expense-form').addEventListener('submit', (e) => this.handleAddExpense(e));
    
    // Income management
    document.getElementById('fixed-income-form').addEventListener('submit', (e) => this.handleFixedIncome(e));
    
    // Goals management
    document.getElementById('add-goal-btn').addEventListener('click', () => this.modals.show('goal-modal'));
    document.getElementById('goal-form').addEventListener('submit', (e) => this.handleAddGoal(e));
    
    // Categories management
    document.getElementById('add-category-btn').addEventListener('click', () => this.modals.show('category-modal'));
    document.getElementById('category-form').addEventListener('submit', (e) => this.handleAddCategory(e));
    
    // Reports and exports
    document.getElementById('generate-report-btn').addEventListener('click', () => this.generateReport());
    document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());
    document.getElementById('import-csv').addEventListener('change', (e) => this.importCSV(e));
    
    // Search
    document.getElementById('expense-search').addEventListener('input', (e) => this.handleSearch(e));
    
    // Chat
    this.chat.init();
    
    // Modal events
    this.modals.init();
  }

  async handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username') || document.getElementById('login-user').value;
    const password = formData.get('password') || document.getElementById('login-pass').value;

    try {
      const success = await this.auth.login(username, password);
      if (success) {
        this.showApp();
        await this.loadUserData();
        this.ui.showAlert('¡Bienvenido de vuelta!', 'success');
      } else {
        this.ui.showAlert('Credenciales incorrectas', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.ui.showAlert('Error al iniciar sesión', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username') || document.getElementById('register-user').value;
    const password = formData.get('password') || document.getElementById('register-pass').value;

    try {
      const success = await this.auth.register(username, password);
      if (success) {
        this.showLogin();
        this.ui.showAlert('Cuenta creada exitosamente. Ahora puedes iniciar sesión.', 'success');
      } else {
        this.ui.showAlert('Error al crear la cuenta', 'error');
      }
    } catch (error) {
      console.error('Register error:', error);
      this.ui.showAlert('Error al registrar usuario', 'error');
    }
  }

  showAuth() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  showApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    
    // Update user info
    const currentUser = this.auth.getCurrentUser();
    document.getElementById('user-name').textContent = `👤 ${currentUser}`;
    
    // Initialize month selector
    this.initMonthSelector();
  }

  showLogin() {
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
  }

  showRegister() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');
  }

  async loadUserData() {
    await this.data.loadUserData();
    this.updateUI();
  }

  initMonthSelector() {
    const select = document.getElementById('month-select');
    select.innerHTML = '';
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Generate options for current year and next year
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = value;
        option.textContent = new Date(year, month - 1).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long' 
        });
        select.appendChild(option);
      }
    }
    
    select.value = this.currentMonth;
  }

  handleMonthChange(e) {
    this.currentMonth = e.target.value;
    this.updateUI();
  }

  async handleAddExpense(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const expense = {
      description: formData.get('description') || document.getElementById('expense-description').value,
      amount: parseFloat(formData.get('amount') || document.getElementById('expense-amount').value),
      category: formData.get('category') || document.getElementById('expense-category').value,
      installments: parseInt(formData.get('installments') || document.getElementById('expense-installments').value) || 1,
      recurring: formData.has('recurring') || document.getElementById('expense-recurring').checked,
      date: this.currentMonth
    };

    if (!expense.description || !expense.amount || !expense.category) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      await this.data.addExpense(expense);
      this.modals.hide('expense-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Gasto agregado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      this.ui.showAlert('Error al agregar el gasto', 'error');
    }
  }

  async handleFixedIncome(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('fixed-income-input').value);
    
    if (!amount || amount <= 0) {
      this.ui.showAlert('Por favor ingresa un monto válido', 'error');
      return;
    }

    try {
      await this.data.setFixedIncome(amount);
      document.getElementById('fixed-income-input').value = '';
      this.updateUI();
      this.ui.showAlert('Ingreso fijo actualizado', 'success');
    } catch (error) {
      console.error('Error setting fixed income:', error);
      this.ui.showAlert('Error al actualizar el ingreso', 'error');
    }
  }

  async handleAddGoal(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const goal = {
      name: formData.get('name') || document.getElementById('goal-name').value,
      target: parseFloat(formData.get('target') || document.getElementById('goal-target').value),
      current: parseFloat(formData.get('current') || document.getElementById('goal-current').value) || 0
    };

    if (!goal.name || !goal.target || goal.target <= 0) {
      this.ui.showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      await this.data.addGoal(goal);
      this.modals.hide('goal-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Objetivo creado exitosamente', 'success');
    } catch (error) {
      console.error('Error adding goal:', error);
      this.ui.showAlert('Error al crear el objetivo', 'error');
    }
  }

  async handleAddCategory(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const category = {
      name: formData.get('name') || document.getElementById('category-name').value,
      icon: formData.get('icon') || document.getElementById('category-icon').value || '🏷️',
      color: formData.get('color') || document.getElementById('category-color').value
    };

    if (!category.name) {
      this.ui.showAlert('Por favor ingresa un nombre para la categoría', 'error');
      return;
    }

    try {
      await this.data.addCategory(category);
      this.modals.hide('category-modal');
      e.target.reset();
      this.updateUI();
      this.ui.showAlert('Categoría creada exitosamente', 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      this.ui.showAlert('Error al crear la categoría', 'error');
    }
  }

  handleSearch(e) {
    const query = e.target.value.toLowerCase();
    this.ui.filterExpenses(query);
  }

  async generateReport() {
    try {
      const reportData = await this.data.generateReport(this.currentMonth);
      this.reports.generate(reportData);
      this.modals.show('report-modal');
    } catch (error) {
      console.error('Error generating report:', error);
      this.ui.showAlert('Error al generar el informe', 'error');
    }
  }

  async exportCSV() {
    try {
      const csvData = await this.data.exportToCSV();
      this.downloadFile(csvData, 'finzn-export.csv', 'text/csv');
      this.ui.showAlert('Datos exportados exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      this.ui.showAlert('Error al exportar los datos', 'error');
    }
  }

  async importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await this.data.importFromCSV(text);
      this.updateUI();
      this.ui.showAlert('Datos importados exitosamente', 'success');
    } catch (error) {
      console.error('Error importing CSV:', error);
      this.ui.showAlert('Error al importar los datos', 'error');
    }
  }

  updateUI() {
    this.ui.updateBalance(this.data.getBalance(this.currentMonth));
    this.ui.updateExpensesList(this.data.getExpenses(this.currentMonth));
    this.ui.updateGoalsList(this.data.getGoals());
    this.ui.updateCategoriesList(this.data.getCategories());
    this.ui.updateIncomeDisplay(this.data.getIncome(this.currentMonth));
    this.ui.updateStats(this.data.getStats());
    this.ui.updateAchievements(this.data.getAchievements());
    
    // Update charts
    this.charts.updateExpensesChart(this.data.getExpensesByCategory(this.currentMonth));
    this.charts.updateTrendChart(this.data.getMonthlyTrend());
    
    // Update category options in expense form
    this.ui.updateCategoryOptions(this.data.getCategories());
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new FinznApp();
});