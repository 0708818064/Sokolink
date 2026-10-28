package ke.co.sokolink.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import ke.co.sokolink.app.data.model.Product
import ke.co.sokolink.app.ui.screens.*
import ke.co.sokolink.app.ui.theme.EmeraldPrimary
import ke.co.sokolink.app.ui.theme.SokoLinkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SokoLinkTheme {
                MainAppScreen()
            }
        }
    }
}

enum class AppTab {
    CATALOG, CART, TRACKING, PORTAL
}

@Composable
fun MainAppScreen() {
    var currentTab by remember { mutableStateOf(AppTab.CATALOG) }
    val cartItems = remember { mutableStateListOf<Product>() }
    var activeTrackingToken by remember { mutableStateOf("track-demo-749201") }
    var userRole by remember { mutableStateOf<String?>("CUSTOMER") }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = currentTab == AppTab.CATALOG,
                    onClick = { currentTab = AppTab.CATALOG },
                    icon = { Icon(Icons.Default.Storefront, contentDescription = "Catalogue") },
                    label = { Text("Shop") }
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.CART,
                    onClick = { currentTab = AppTab.CART },
                    icon = {
                        BadgedBox(
                            badge = {
                                if (cartItems.isNotEmpty()) {
                                    Badge(containerColor = EmeraldPrimary) {
                                        Text("${cartItems.size}")
                                    }
                                }
                            }
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = "Cart")
                        }
                    },
                    label = { Text("Cart") }
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.TRACKING,
                    onClick = { currentTab = AppTab.TRACKING },
                    icon = { Icon(Icons.Default.LocationOn, contentDescription = "Tracking") },
                    label = { Text("Track") }
                )
                NavigationBarItem(
                    selected = currentTab == AppTab.PORTAL,
                    onClick = { currentTab = AppTab.PORTAL },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Portal") },
                    label = { Text(if (userRole == "DELIVERY") "Rider" else "Account") }
                )
            }
        }
    ) { padding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            color = MaterialTheme.colorScheme.background
        ) {
            when (currentTab) {
                AppTab.CATALOG -> {
                    CatalogScreen(
                        onAddToCart = { product ->
                            cartItems.add(product)
                        },
                        onBuyNow = { product ->
                            cartItems.add(product)
                            currentTab = AppTab.CART // Direct checkout navigation
                        },
                        onNavigateToTracking = {
                            currentTab = AppTab.TRACKING
                        }
                    )
                }

                AppTab.CART -> {
                    CartScreen(
                        items = cartItems,
                        onBack = { currentTab = AppTab.CATALOG },
                        onOrderPlaced = { token ->
                            activeTrackingToken = token
                            cartItems.clear()
                            currentTab = AppTab.TRACKING
                        }
                    )
                }

                AppTab.TRACKING -> {
                    TrackingScreen(
                        trackingToken = activeTrackingToken,
                        onBack = { currentTab = AppTab.CATALOG }
                    )
                }

                AppTab.PORTAL -> {
                    if (userRole == "DELIVERY") {
                        CourierScreen(
                            onLogout = { userRole = "CUSTOMER" }
                        )
                    } else {
                        LoginScreen(
                            onLoginSuccess = { role ->
                                userRole = role
                                if (role == "DELIVERY") {
                                    currentTab = AppTab.PORTAL
                                } else {
                                    currentTab = AppTab.CATALOG
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
