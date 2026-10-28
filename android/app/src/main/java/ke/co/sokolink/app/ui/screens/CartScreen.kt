package ke.co.sokolink.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.co.sokolink.app.data.model.Product
import ke.co.sokolink.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    items: List<Product>,
    onBack: () -> Unit,
    onOrderPlaced: (String) -> Unit // returns trackingToken
) {
    var recipientName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var county by remember { mutableStateOf("Nairobi") }
    var subCounty by remember { mutableStateOf("") }
    var estateOrStreet by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }

    val itemsSubtotal = items.sumOf { it.discountedPrice ?: it.price }
    val deliveryFee = if (county == "Nairobi") 200.0 else 350.0
    val totalPayable = itemsSubtotal + deliveryFee

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("M-Pesa Checkout", fontWeight = FontWeight.Bold, color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = EmeraldPrimary)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(Slate50)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Summary Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Order Summary", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    items.forEach { item ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(item.name, fontSize = 12.sp, modifier = Modifier.weight(1f))
                            Text("KES ${"%,.0f".format(item.discountedPrice ?: item.price)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Courier Fee ($county)", fontSize = 12.sp, color = Slate500)
                        Text("KES ${"%,.0f".format(deliveryFee)}", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Due", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("KES ${"%,.0f".format(totalPayable)}", fontWeight = FontWeight.Black, fontSize = 16.sp, color = EmeraldDark)
                    }
                }
            }

            // Location Input Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Kenyan Delivery Destination", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    OutlinedTextField(
                        value = recipientName,
                        onValueChange = { recipientName = it },
                        label = { Text("Recipient Full Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Safaricom M-Pesa Number") },
                        placeholder = { Text("0712345678 or 254...") },
                        leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = subCounty,
                        onValueChange = { subCounty = it },
                        label = { Text("Sub-County / Area") },
                        placeholder = { Text("e.g. Westlands, Kilimani, Roysambu") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    OutlinedTextField(
                        value = estateOrStreet,
                        onValueChange = { estateOrStreet = it },
                        label = { Text("Estate, Street & House / Door No.") },
                        placeholder = { Text("e.g. Silver Harbor, Door 4B") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            // Escrow info
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(EmeraldContainer.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(12.dp)
            ) {
                Icon(Icons.Default.Security, contentDescription = null, tint = EmeraldDark, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Funds escrowed until you provide your secret 6-digit OTP code to the rider.",
                    fontSize = 11.sp,
                    color = EmeraldDark
                )
            }

            // Trigger STK Push Button
            Button(
                onClick = {
                    isProcessing = true
                    // Simulate order creation & STK prompt trigger
                    onOrderPlaced("track-${System.currentTimeMillis()}")
                },
                enabled = recipientName.isNotBlank() && phone.isNotBlank() && subCounty.isNotBlank() && !isProcessing,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                modifier = Modifier.fillMaxWidth().height(52.dp)
            ) {
                if (isProcessing) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                } else {
                    Text("Pay KES ${"%,.0f".format(totalPayable)} with M-Pesa", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }
}
