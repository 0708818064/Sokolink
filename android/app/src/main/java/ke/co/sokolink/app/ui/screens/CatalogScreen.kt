package ke.co.sokolink.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import ke.co.sokolink.app.data.model.Product
import ke.co.sokolink.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogScreen(
    onAddToCart: (Product) -> Unit,
    onBuyNow: (Product) -> Unit,
    onNavigateToTracking: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    // Mock initial catalogue items matching the PostgreSQL database seed
    val products = remember {
        listOf(
            Product(
                id = "prod-1",
                name = "Handmade Sisal Kiondo Bag",
                slug = "handmade-sisal-kiondo-bag",
                price = 3500.0,
                discountedPrice = 2999.0,
                stock = 15,
                rating = 4.9,
                location = "Westlands, Nairobi",
                images = listOf(ke.co.sokolink.app.data.model.ProductImage("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"))
            ),
            Product(
                id = "prod-2",
                name = "Organic Cold Pressed Macadamia Oil",
                slug = "organic-macadamia-oil",
                price = 1450.0,
                stock = 24,
                rating = 4.8,
                location = "Limuru Road, Kiambu",
                images = listOf(ke.co.sokolink.app.data.model.ProductImage("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80"))
            ),
            Product(
                id = "prod-3",
                name = "Heavy Duty Motorbike Rain Poncho",
                slug = "motorbike-rain-poncho",
                price = 1800.0,
                stock = 40,
                rating = 4.7,
                location = "Luthuli Ave, Nairobi",
                images = listOf(ke.co.sokolink.app.data.model.ProductImage("https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80"))
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("SokoLink", fontWeight = FontWeight.Black, fontSize = 20.sp, color = Color.White)
                        Text("Authentic Kenyan Marketplace", fontSize = 11.sp, color = EmeraldContainer)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EmeraldPrimary),
                actions = {
                    IconButton(onClick = onNavigateToTracking) {
                        Icon(Icons.Default.LocationOn, contentDescription = "Track Order", tint = Color.White)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Slate50)
        ) {
            // Search Input
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search products, electronics, crafts...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = EmeraldPrimary,
                    unfocusedContainerColor = Color.White,
                    focusedContainerColor = Color.White
                ),
                singleLine = true
            )

            // Products List
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(products) { product ->
                    ProductCardItem(
                        product = product,
                        onAddToCart = { onAddToCart(product) },
                        onBuyNow = { onBuyNow(product) }
                    )
                }
            }
        }
    }
}

@Composable
fun ProductCardItem(
    product: Product,
    onAddToCart: () -> Unit,
    onBuyNow: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Product Image
            val imageUrl = product.images?.firstOrNull()?.url
            AsyncImage(
                model = imageUrl,
                contentDescription = product.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(180.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(Slate200),
                contentScale = ContentScale.Crop
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Title & Location
            Text(
                text = product.name,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp,
                color = Slate900
            )

            product.location?.let {
                Text(
                    text = "📍 $it",
                    fontSize = 11.sp,
                    color = Slate500,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Pricing
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    val price = product.discountedPrice ?: product.price
                    Text(
                        text = "KES ${"%,.0f".format(price)}",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = EmeraldDark
                    )
                    if (product.discountedPrice != null) {
                        Text(
                            text = "KES ${"%,.0f".format(product.price)}",
                            fontSize = 12.sp,
                            color = Slate500
                        )
                    }
                }

                Text(
                    text = "★ ${product.rating}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = AmberWarning
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action Buttons: Add to Cart and Buy Now
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onAddToCart,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = EmeraldPrimary)
                ) {
                    Icon(Icons.Default.ShoppingCart, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Add to Cart", fontSize = 12.sp)
                }

                Button(
                    onClick = onBuyNow,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary)
                ) {
                    Icon(Icons.Default.FlashOn, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Buy Now", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
