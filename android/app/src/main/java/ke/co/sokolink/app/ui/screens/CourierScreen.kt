package ke.co.sokolink.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.co.sokolink.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CourierScreen(
    onLogout: () -> Unit
) {
    var otpInput by remember { mutableStateOf("") }
    var isDelivered by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Courier Dispatch Tasks", fontWeight = FontWeight.Bold, color = Color.White) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900),
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Logout", tint = Color.White)
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Active task
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Task #DEL-8491", fontWeight = FontWeight.Black, fontSize = 14.sp)
                        Text(
                            text = if (isDelivered) "DELIVERED" else "IN_TRANSIT",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isDelivered) EmeraldDark else Color(0xFF2563EB),
                            modifier = Modifier
                                .background(
                                    if (isDelivered) EmeraldContainer else Color(0xFFDBEAFE),
                                    RoundedCornerShape(8.dp)
                                )
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }

                    Divider()

                    Text("🏪 Pickup: Maasai Artisans, Westlands Mall Stall 4", fontSize = 12.sp, color = Slate700)
                    Text("📍 Dropoff: Argwings Kodhek Rd, Silver Harbor Apts 4B", fontSize = 12.sp, color = Slate700)
                    Text("👤 Recipient: Wambui Kamau (0799 000 009)", fontSize = 12.sp, fontWeight = FontWeight.Bold)

                    Divider()

                    if (!isDelivered) {
                        Text("Doorstep OTP Handover Verification", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("Ask the recipient for the 6-digit code on their tracking screen:", fontSize = 11.sp, color = Slate500)

                        OutlinedTextField(
                            value = otpInput,
                            onValueChange = { otpInput = it },
                            placeholder = { Text("e.g. 749201") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )

                        if (errorMessage.isNotEmpty()) {
                            Text(errorMessage, color = MaterialTheme.colorScheme.error, fontSize = 11.sp)
                        }

                        Button(
                            onClick = {
                                if (otpInput.trim() == "749201" || otpInput.trim().length == 6) {
                                    isDelivered = true
                                    errorMessage = ""
                                } else {
                                    errorMessage = "Invalid verification code. Please confirm with recipient."
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Text("Verify Handover & Authorize Payout", fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(EmeraldContainer, RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = EmeraldDark)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Delivery verified successfully! Escrow funds released.", fontWeight = FontWeight.Bold, color = EmeraldDark, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
