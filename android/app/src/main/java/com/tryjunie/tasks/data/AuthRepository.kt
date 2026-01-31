package com.tryjunie.tasks.data

import com.tryjunie.tasks.domain.LoginCredentials
import com.tryjunie.tasks.domain.RegisterCredentials
import com.tryjunie.tasks.domain.User
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val auth: Auth
) {
    suspend fun login(credentials: LoginCredentials): Result<User> {
        return try {
            auth.signInWith(Email) {
                email = credentials.email
                password = credentials.password
            }
            
            val user = auth.currentUserOrNull()
            if (user != null) {
                Result.success(User(id = user.id, email = user.email ?: ""))
            } else {
                Result.failure(Exception("Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(credentials: RegisterCredentials): Result<User> {
        return try {
            auth.signUpWith(Email) {
                email = credentials.email
                password = credentials.password
            }
            
            val user = auth.currentUserOrNull()
            if (user != null) {
                Result.success(User(id = user.id, email = user.email ?: ""))
            } else {
                Result.failure(Exception("Registration failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout(): Result<Unit> {
        return try {
            auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getCurrentUser(): User? {
        val user = auth.currentUserOrNull()
        return user?.let { User(id = it.id, email = it.email ?: "") }
    }

    fun isAuthenticated(): Boolean {
        return auth.currentUserOrNull() != null
    }
}
