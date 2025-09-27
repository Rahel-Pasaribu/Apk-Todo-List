// Soft Aesthetic Todo List Application
class TodoApp {
  constructor() {
    this.todos = [];
    this.filter = "all";
    this.searchQuery = "";
    this.editingId = null;
    this.draggedItem = null;
    this.dragOverIndex = null;

    this.init();
  }

  init() {
    this.loadTodos();
    this.bindEvents();
    this.render();
  }

  // Load todos from localStorage
  loadTodos() {
    const savedTodos = localStorage.getItem("softTodos");
    if (savedTodos) {
      try {
        this.todos = JSON.parse(savedTodos).sort((a, b) => a.order - b.order);
      } catch (error) {
        console.warn("Failed to parse saved todos, initializing empty list:", error);
        this.todos = [];
      }
    }
  }

  // Save todos to localStorage
  saveTodos() {
    try {
      localStorage.setItem("softTodos", JSON.stringify(this.todos));
    } catch (error) {
      this.showError("Storage limit reached. Please delete some items.");
      console.error("LocalStorage error:", error);
    }
  }

  // Bind event listeners
  bindEvents() {
    const addBtn = document.getElementById("addTodoBtn");
    const newTodoInput = document.getElementById("newTodoInput");
    const searchInput = document.getElementById("searchInput");

    if (addBtn) {
      addBtn.addEventListener("click", () => this.addTodo());
    } else {
      console.warn("Add button not found in DOM.");
    }

    if (newTodoInput) {
      newTodoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addTodo();
      });
      newTodoInput.addEventListener("input", () => this.hideError());
    } else {
      console.warn("New todo input not found in DOM.");
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
      });
    } else {
      console.warn("Search input not found in DOM.");
    }

    const filterRadios = document.querySelectorAll('input[name="filter"]');
    if (filterRadios.length > 0) {
      filterRadios.forEach((radio) => {
        radio.addEventListener("change", (e) => {
          this.filter = e.target.value;
          this.updateListTitle();
          this.render();
        });
      });
    } else {
      console.warn("Filter radios not found in DOM.");
    }
  }

  // Add new todo
  addTodo() {
    const input = document.getElementById("newTodoInput");
    if (!input) {
      this.showError("Input field not available.");
      return;
    }

    const title = input.value.trim();

    if (!title) {
      this.showError("Please enter a dream to add ✨");
      return;
    }

    if (title.length > 100) {
      this.showError("Dream title is too long (max 100 characters) 💭");
      return;
    }

    if (this.todos.some((todo) => todo.title.toLowerCase() === title.toLowerCase())) {
      this.showError("This dream already exists in your list 💭");
      return;
    }

    const newTodo = {
      id: Date.now().toString(),
      title: title,
      completed: false,
      createdAt: Date.now(),
      order: this.todos.length,
      priority: false, // Tambahkan properti priority
    };

    this.todos.push(newTodo);
    this.saveTodos();
    input.value = "";
    this.hideError();
    this.render();

    setTimeout(() => {
      const newTodoElement = document.querySelector(`[data-id="${newTodo.id}"]`);
      if (newTodoElement) newTodoElement.classList.add("new");
    }, 10);
  }

  // Toggle todo completion
  toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.saveTodos();
      this.render();
    } else {
      console.warn(`Todo with id ${id} not found.`);
    }
  }

  // Delete todo
  deleteTodo(id) {
    this.todos = this.todos.filter((t) => t.id !== id);
    this.saveTodos();
    this.render();
  }

  // Start editing todo
  startEditing(id) {
    this.editingId = id;
    this.hideError();
    this.render();

    setTimeout(() => {
      const editInput = document.querySelector(".edit-input");
      if (editInput) {
        editInput.focus();
        editInput.select();
      } else {
        console.warn("Edit input not found during editing.");
      }
    }, 10);
  }

  // Save edit
  saveEdit(id, newTitle) {
    const trimmedTitle = newTitle.trim();

    if (!trimmedTitle) {
      this.showError("Dream title cannot be empty ✨");
      return;
    }

    if (trimmedTitle.length > 100) {
      this.showError("Dream title is too long (max 100 characters) 💭");
      return;
    }

    if (this.todos.some((todo) => todo.id !== id && todo.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      this.showError("This dream already exists in your list 💭");
      return;
    }

    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.title = trimmedTitle;
      this.editingId = null;
      this.saveTodos();
      this.hideError();
      this.render();
    } else {
      console.warn(`Todo with id ${id} not found for editing.`);
    }
  }

  // Cancel edit
  cancelEdit() {
    this.editingId = null;
    this.hideError();
    this.render();
  }

  // Drag and drop handlers
  handleDragStart(e, todo, index) {
    this.draggedItem = todo;
    e.dataTransfer.effectAllowed = "move";
    e.target.classList.add("dragging");

    try {
      const dragImage = e.target.cloneNode(true);
      dragImage.style.transform = "rotate(5deg)";
      dragImage.style.opacity = "0.8";
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    } catch (error) {
      console.warn("Drag image creation failed:", error);
    }
  }

  handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    const todoItem = e.currentTarget;
    if (this.draggedItem && todoItem.dataset.id !== this.draggedItem.id) {
      this.dragOverIndex = index;
      todoItem.classList.add("drag-over");
    }
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
    this.dragOverIndex = null;
  }

  handleDrop(e, dropIndex) {
    e.preventDefault();
    const todoItem = e.currentTarget;
    todoItem.classList.remove("drag-over");

    if (!this.draggedItem) return;

    const filteredTodos = this.getFilteredTodos();
    const dragIndex = filteredTodos.findIndex((todo) => todo.id === this.draggedItem.id);

    if (dragIndex === dropIndex) {
      this.dragOverIndex = null;
      return;
    }

    const newFilteredTodos = [...filteredTodos];
    newFilteredTodos.splice(dragIndex, 1);
    newFilteredTodos.splice(dropIndex, 0, this.draggedItem);

    const updatedTodos = newFilteredTodos.map((todo, index) => ({
      ...todo,
      order: index,
    }));

    const todoMap = new Map(updatedTodos.map((todo) => [todo.id, todo]));
    this.todos = this.todos.map((todo) => todoMap.get(todo.id) || todo).sort((a, b) => a.order - b.order);

    this.saveTodos();
    this.render();
    this.dragOverIndex = null;
  }

  handleDragEnd(e) {
    e.target.classList.remove("dragging");
    document.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    this.draggedItem = null;
    this.dragOverIndex = null;
  }

  // Get filtered todos
  getFilteredTodos() {
    return this.todos
      .filter((todo) => {
        const matchesFilter =
          this.filter === "all" ||
          (this.filter === "active" && !todo.completed) ||
          (this.filter === "completed" && todo.completed);

        const matchesSearch = todo.title.toLowerCase().includes(this.searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => a.order - b.order);
  }

  // Get todo stats
  getTodoStats() {
    return {
      total: this.todos.length,
      active: this.todos.filter((todo) => !todo.completed).length,
      completed: this.todos.filter((todo) => todo.completed).length,
    };
  }

  // Update list title
  updateListTitle() {
    const titleElement = document.getElementById("listTitle");
    if (!titleElement) {
      console.warn("List title element not found.");
      return;
    }

    let title = "";

    switch (this.filter) {
      case "all":
        title = "All Dreams";
        break;
      case "active":
        title = "Dreams in Progress";
        break;
      case "completed":
        title = "Completed Dreams";
        break;
    }

    if (this.searchQuery) {
      title += ` - Search: "${this.searchQuery}"`;
    }

    titleElement.textContent = title;
  }

  // Show error message
  showError(message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    } else {
      console.warn("Error message element not found.");
    }
  }

  // Hide error message
  hideError() {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
      errorElement.classList.remove("show");
    }
  }

  // Render the application
  render() {
    this.renderStats();
    this.renderTodos();
    this.updateListTitle();
  }

  // Render stats
  renderStats() {
    const stats = this.getTodoStats();

    const totalCountEl = document.getElementById("totalCount");
    const activeCountEl = document.getElementById("activeCount");
    const completedCountEl = document.getElementById("completedCount");
    const allCountEl = document.getElementById("allCount");
    const activeFilterCountEl = document.getElementById("activeFilterCount");
    const completedFilterCountEl = document.getElementById("completedFilterCount");

    if (totalCountEl) totalCountEl.textContent = stats.total;
    if (activeCountEl) activeCountEl.textContent = stats.active;
    if (completedCountEl) completedCountEl.textContent = stats.completed;
    if (allCountEl) allCountEl.textContent = stats.total;
    if (activeFilterCountEl) activeFilterCountEl.textContent = stats.active;
    if (completedFilterCountEl) completedFilterCountEl.textContent = stats.completed;
  }

  // Render todos
  renderTodos() {
    const todoList = document.getElementById("todoList");
    const emptyState = document.getElementById("emptyState");
    const dragHelp = document.getElementById("dragHelp");

    if (!todoList || !emptyState) {
      console.warn("Todo list or empty state element not found.");
      return;
    }

    const filteredTodos = this.getFilteredTodos();

    if (filteredTodos.length === 0) {
      todoList.innerHTML = "";
      emptyState.classList.add("show");
      if (dragHelp) dragHelp.classList.remove("show");

      const emptyText = emptyState.querySelector(".empty-text");
      const emptySubtext = emptyState.querySelector(".empty-subtext");

      if (emptyText && emptySubtext) {
        if (this.searchQuery) {
          emptyText.textContent = "No dreams match your search";
          emptySubtext.textContent = "Try a different search term ✨";
        } else if (this.filter === "active") {
          emptyText.textContent = "No active dreams";
          emptySubtext.textContent = "All your dreams are complete! 🎉";
        } else if (this.filter === "completed") {
          emptyText.textContent = "No completed dreams";
          emptySubtext.textContent = "Start completing your dreams! 💫";
        } else {
          emptyText.textContent = "No dreams found";
          emptySubtext.textContent = "Start by adding your first dream above ✨";
        }
      }
    } else {
      emptyState.classList.remove("show");
      if (dragHelp) {
        dragHelp.classList.toggle("show", filteredTodos.length > 1);
      }

      todoList.innerHTML = filteredTodos.map((todo, index) => this.renderTodoItem(todo, index)).join("");

      this.bindTodoEvents();
    }
  }

  // Render individual todo item
  renderTodoItem(todo, index) {
    const isEditing = this.editingId === todo.id;
    const escapedTitle = this.escapeHtml(todo.title);

    return `
      <div class="todo-item ${todo.completed ? "completed" : ""} ${isEditing ? "editing" : ""}" 
           data-id="${todo.id}" 
           draggable="true">
        <div class="todo-content">
          <i class="bi bi-grip-vertical drag-handle"></i>
          
          <div class="todo-checkbox ${todo.completed ? "completed" : ""}" 
               onclick="todoApp.toggleTodo('${todo.id}')">
            ${todo.completed ? '<i class="bi bi-check"></i>' : ""}
          </div>

          <div class="todo-main">
            ${
              isEditing
                ? `
                <div class="edit-group">
                  <input type="text" class="edit-input" 
                         value="${escapedTitle}" 
                         maxlength="100"
                         aria-label="Edit todo: ${escapedTitle}"
                         onkeypress="if(event.key==='Enter') todoApp.saveEdit('${todo.id}', this.value); if(event.key==='Escape') todoApp.cancelEdit()">
                  <div class="edit-actions">
                    <button class="action-btn save" 
                            aria-label="Save changes to: ${escapedTitle}"
                            title="Save changes"
                            onclick="todoApp.saveEdit('${todo.id}', this.parentElement.parentElement.querySelector('.edit-input').value)">
                      <i class="bi bi-check"></i>
                    </button>
                    <button class="action-btn cancel" 
                            aria-label="Cancel editing: ${escapedTitle}"
                            title="Cancel editing"
                            onclick="todoApp.cancelEdit()">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                </div>
              `
                : `
                <div class="todo-title-container">
                  <span class="todo-title">${escapedTitle}</span>
                </div>
                <div class="todo-meta">
                  <span class="todo-badge ${todo.completed ? "completed" : "active"}">
                    ${todo.completed ? "Done" : "Active"}
                  </span>
                  <div class="todo-actions">
                    <button class="action-btn edit" 
                            aria-label="Edit todo: ${escapedTitle}"
                            title="Edit this todo"
                            onclick="todoApp.startEditing('${todo.id}')">
                      <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn delete" 
                            aria-label="Delete todo: ${escapedTitle}"
                            title="Delete this todo"
                            onclick="todoApp.deleteTodo('${todo.id}')">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              `
            }
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Bind events for todo items
  bindTodoEvents() {
    const todoItems = document.querySelectorAll(".todo-item");
    if (todoItems.length > 0) {
      todoItems.forEach((item, index) => {
        const todoId = item.dataset.id;
        const todo = this.todos.find((t) => t.id === todoId);

        if (todo) {
          item.addEventListener("dragstart", (e) => this.handleDragStart(e, todo, index));
          item.addEventListener("dragover", (e) => this.handleDragOver(e, index));
          item.addEventListener("dragleave", (e) => this.handleDragLeave(e));
          item.addEventListener("drop", (e) => this.handleDrop(e, index));
          item.addEventListener("dragend", (e) => this.handleDragEnd(e));
        } else {
          console.warn(`Todo with id ${todoId} not found for binding events.`);
        }
      });
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    window.todoApp = new TodoApp();
  } catch (error) {
    console.error("Failed to initialize TodoApp:", error);
  }
});