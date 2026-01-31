package com.tryjunie.tasks.domain

data class User(
    val id: String,
    val email: String
)

data class LoginCredentials(
    val email: String,
    val password: String
)

data class RegisterCredentials(
    val email: String,
    val password: String
)
