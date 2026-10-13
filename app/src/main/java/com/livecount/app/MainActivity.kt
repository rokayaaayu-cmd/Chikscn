package com.livecount.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.livecount.app.ui.theme.LiveCountTheme
import com.livecount.app.ui.screens.CameraScreen
import com.livecount.app.ui.screens.TrainingScreen
import com.livecount.app.ui.screens.ModelManagerScreen
import com.livecount.app.ui.screens.TestLabScreen
import com.livecount.app.ui.screens.ReportsScreen
import com.livecount.app.ui.screens.SettingsScreen

sealed class Screen(val route: String, val title: String, val icon: @Composable () -> Unit) {
    object Camera : Screen("camera", "Camera", { Icon(Icons.Default.Camera, "Camera") })
    object Training : Screen("training", "Training", { Icon(Icons.Default.FitnessCenter, "Training") })
    object Models : Screen("models", "Models", { Icon(Icons.Default.ViewInAr, "Models") })
    object TestLab : Screen("testlab", "Test Lab", { Icon(Icons.Default.Science, "Test Lab") })
    object Reports : Screen("reports", "Reports", { Icon(Icons.Default.BarChart, "Reports") })
    object Settings : Screen("settings", "Settings", { Icon(Icons.Default.Settings, "Settings") })
}

val screens = listOf(
    Screen.Camera,
    Screen.Training,
    Screen.Models,
    Screen.TestLab,
    Screen.Reports,
    Screen.Settings
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LiveCountTheme {
                MainApp()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Live Count",
                        style = MaterialTheme.typography.titleLarge
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        },
        bottomBar = {
            NavigationBar {
                screens.forEach { screen ->
                    NavigationBarItem(
                        icon = { screen.icon() },
                        label = { Text(screen.title, style = MaterialTheme.typography.labelSmall) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Camera.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Camera.route) { CameraScreen() }
            composable(Screen.Training.route) { TrainingScreen() }
            composable(Screen.Models.route) { ModelManagerScreen() }
            composable(Screen.TestLab.route) { TestLabScreen() }
            composable(Screen.Reports.route) { ReportsScreen() }
            composable(Screen.Settings.route) { SettingsScreen() }
        }
    }
}
