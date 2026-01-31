package com.tryjunie.tasks.data

import com.tryjunie.tasks.domain.Task
import com.tryjunie.tasks.domain.TaskCreate
import com.tryjunie.tasks.domain.TaskUpdate
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.datetime.LocalDate
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class TaskDto(
    val id: String,
    val title: String,
    val description: String? = null,
    val user_id: String,
    val estimated_minute: Int? = null,
    val category_id: String? = null,
    val task_date: String,
    val task_order: Int? = null,
    val start_time: String? = null,
    val end_time: String? = null,
    val created_at: String,
    val updated_at: String
)

@Singleton
class TaskRepository @Inject constructor(
    private val postgrest: Postgrest,
    private val auth: Auth
) {
    suspend fun getTasks(date: LocalDate): Result<List<Task>> {
        return try {
            val userId = auth.currentUserOrNull()?.id ?: return Result.failure(Exception("Not authenticated"))
            
            val response = postgrest["tasks"]
                .select() {
                    filter {
                        eq("user_id", userId)
                        eq("task_date", date.toString())
                    }
                    order("task_order", ascending = true)
                }
            
            // Parse response and convert to domain models
            Result.success(emptyList()) // TODO: Implement parsing
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTask(task: TaskCreate): Result<Task> {
        return try {
            val userId = auth.currentUserOrNull()?.id ?: return Result.failure(Exception("Not authenticated"))
            
            // TODO: Implement task creation
            Result.failure(Exception("Not implemented"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTask(taskId: String, update: TaskUpdate): Result<Task> {
        return try {
            // TODO: Implement task update
            Result.failure(Exception("Not implemented"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTask(taskId: String): Result<Unit> {
        return try {
            val userId = auth.currentUserOrNull()?.id ?: return Result.failure(Exception("Not authenticated"))
            
            postgrest["tasks"].delete {
                filter {
                    eq("id", taskId)
                    eq("user_id", userId)
                }
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
