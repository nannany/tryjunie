package com.tryjunie.tasks.data

import com.tryjunie.tasks.domain.Task
import com.tryjunie.tasks.domain.TaskCreate
import com.tryjunie.tasks.domain.TaskUpdate
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.decodeFromJsonElement
import kotlinx.serialization.json.jsonArray
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
    private fun TaskDto.toDomain(): Task {
        return Task(
            id = id,
            title = title,
            description = description ?: "",
            userId = user_id,
            estimatedMinute = estimated_minute,
            categoryId = category_id,
            taskDate = LocalDate.parse(task_date),
            taskOrder = task_order,
            startTime = start_time?.let { Instant.parse(it).toLocalDateTime(TimeZone.UTC) },
            endTime = end_time?.let { Instant.parse(it).toLocalDateTime(TimeZone.UTC) },
            createdAt = Instant.parse(created_at).toLocalDateTime(TimeZone.UTC),
            updatedAt = Instant.parse(updated_at).toLocalDateTime(TimeZone.UTC)
        )
    }

    suspend fun getTasks(date: LocalDate): Result<List<Task>> {
        return try {
            val userId = auth.currentUserOrNull()?.id 
                ?: return Result.failure(Exception("Not authenticated"))
            
            val response = postgrest["tasks"]
                .select {
                    filter {
                        eq("user_id", userId)
                        eq("task_date", date.toString())
                    }
                    order("task_order", ascending = true)
                }
            
            val tasks = response.decodeList<TaskDto>().map { it.toDomain() }
            Result.success(tasks)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createTask(task: TaskCreate): Result<Task> {
        return try {
            val userId = auth.currentUserOrNull()?.id 
                ?: return Result.failure(Exception("Not authenticated"))
            
            val response = postgrest["tasks"].insert(
                mapOf(
                    "title" to task.title,
                    "description" to task.description,
                    "user_id" to userId,
                    "estimated_minute" to task.estimatedMinute,
                    "category_id" to task.categoryId,
                    "task_date" to task.taskDate.toString()
                )
            ) {
                select()
            }
            
            val createdTask = response.decodeSingle<TaskDto>().toDomain()
            Result.success(createdTask)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTask(taskId: String, update: TaskUpdate): Result<Task> {
        return try {
            val userId = auth.currentUserOrNull()?.id 
                ?: return Result.failure(Exception("Not authenticated"))
            
            val updateMap = mutableMapOf<String, Any?>()
            update.title?.let { updateMap["title"] = it }
            update.description?.let { updateMap["description"] = it }
            update.estimatedMinute?.let { updateMap["estimated_minute"] = it }
            update.categoryId?.let { updateMap["category_id"] = it }
            update.taskDate?.let { updateMap["task_date"] = it.toString() }
            update.taskOrder?.let { updateMap["task_order"] = it }
            update.startTime?.let { updateMap["start_time"] = it.toString() }
            update.endTime?.let { updateMap["end_time"] = it.toString() }
            
            val response = postgrest["tasks"].update(updateMap) {
                filter {
                    eq("id", taskId)
                    eq("user_id", userId)
                }
                select()
            }
            
            val updatedTask = response.decodeSingle<TaskDto>().toDomain()
            Result.success(updatedTask)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteTask(taskId: String): Result<Unit> {
        return try {
            val userId = auth.currentUserOrNull()?.id 
                ?: return Result.failure(Exception("Not authenticated"))
            
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
