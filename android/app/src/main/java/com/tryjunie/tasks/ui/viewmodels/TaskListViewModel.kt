package com.tryjunie.tasks.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tryjunie.tasks.data.TaskRepository
import com.tryjunie.tasks.domain.Task
import com.tryjunie.tasks.domain.TaskCreate
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn
import javax.inject.Inject

@HiltViewModel
class TaskListViewModel @Inject constructor(
    private val taskRepository: TaskRepository
) : ViewModel() {

    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadTasks()
    }

    fun loadTasks() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
            taskRepository.getTasks(today)
                .onSuccess { _tasks.value = it }
                .onFailure { _error.value = it.message }
            
            _isLoading.value = false
        }
    }

    fun createTask(title: String, description: String = "", estimatedMinute: Int? = null) {
        viewModelScope.launch {
            val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
            val taskCreate = TaskCreate(
                title = title,
                description = description,
                estimatedMinute = estimatedMinute,
                taskDate = today
            )
            
            taskRepository.createTask(taskCreate)
                .onSuccess { loadTasks() }
                .onFailure { _error.value = it.message }
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            taskRepository.deleteTask(taskId)
                .onSuccess { loadTasks() }
                .onFailure { _error.value = it.message }
        }
    }

    fun clearError() {
        _error.value = null
    }
}
