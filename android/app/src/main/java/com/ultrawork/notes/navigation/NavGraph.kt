package com.ultrawork.notes.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController

object Routes {
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val NOTES = "notes"
}

@Composable
fun NavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.LOGIN
    ) {
        composable(Routes.LOGIN) {
            // TODO: LoginScreen
        }
        composable(Routes.REGISTER) {
            // TODO: RegisterScreen
        }
        composable(Routes.NOTES) {
            // TODO: NotesScreen
        }
    }
}
