@file:Suppress("MatchingDeclarationName")

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

@Suppress("FunctionNaming")
@Composable
fun NavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.LOGIN
    ) {
        composable(Routes.LOGIN) {
            // LoginScreen placeholder
        }
        composable(Routes.REGISTER) {
            // RegisterScreen placeholder
        }
        composable(Routes.NOTES) {
            // NotesScreen placeholder
        }
    }
}
