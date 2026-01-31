package com.tryjunie.tasks.domain

import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime

data class Task(
    val id: String,
    val title: String,
    val description: String = "",
    val userId: String,
    val estimatedMinute: Int? = null,
    val categoryId: String? = null,
    val taskDate: LocalDate,
    val taskOrder: Int? = null,
    val startTime: LocalDateTime? = null,
    val endTime: LocalDateTime? = null,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
)

data class TaskCreate(
    val title: String,
    val description: String = "",
    val estimatedMinute: Int? = null,
    val categoryId: String? = null,
    val taskDate: LocalDate
)

data class TaskUpdate(
    val title: String? = null,
    val description: String? = null,
    val estimatedMinute: Int? = null,
    val categoryId: String? = null,
    val taskDate: LocalDate? = null,
    val taskOrder: Int? = null,
    val startTime: LocalDateTime? = null,
    val endTime: LocalDateTime? = null
)
