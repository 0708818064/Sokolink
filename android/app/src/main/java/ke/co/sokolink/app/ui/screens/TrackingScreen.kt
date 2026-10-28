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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.co.sokolink.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrackingScreen(
    trackingToken: String = "track-demo",
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Parcel Tracking", fontWeight = FontWeight.Bold, color = Color.White) },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // OTP Code Banner
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = EmeraldContainer),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp).fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        "DOORSTEP HANDOVER OTP",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Black,
                        color = EmeraldDark
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        "749 201",
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = Slate900
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "Give this 6-digit code to your rider only after inspecting your package.",
                        fontSize = 11.sp,
                        color = Slate700,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )
                }
            }

            // Milestone Tracker
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Text("Delivery Milestones", fontWeight = FontWeight.Bold, fontSize = 14.sp)

                    MilestoneRow("1. Order Placed & Paid (M-Pesa)", "Completed", isDone = true)
                    MilestoneRow("2. Merchant Packaged Items", "Westlands Hub", isDone = true)
                    MilestoneRow("3. Assigned to Courier Rider", "Juma Ochieng (KMDF 452X)", isDone = true)
                    MilestoneRow("4. On Delivery Transit", "En route to Kilimani", isDone = true, isCurrent = true)
                    MilestoneRow("5. Doorstep Handover (OTP check)", "Pending verification", isDone = false)
                }
            }

            // Courier Details Card
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(
                            modifier = Modifier.size(44.dp).background(EmeraldPrimary, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.TwoWheeler, contentDescription = null, tint = Color.White)
                        }
                        Column {
                            Text("Juma Ochieng", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Motorbike &bull; KMDF 452X", fontSize = 11.sp, color = Slate500)
                            Text("★ 4.9 rating", fontSize = 11.sp, color = AmberWarning, fontWeight = FontWeight.Bold)
                        }
                    }

                    IconButton(
                        onClick = { /* Launch phone dialer */ },
                        modifier = Modifier.background(EmeraldContainer, RoundedCornerShape(10.dp))
                    ) {
                        Icon(Icons.Default.Phone, contentDescription = "Call Courier", tint = EmeraldDark)
                    }
                }
            }
        }
    }
}

@Composable
fun MilestoneRow(title: String, subtitle: String, isDone: Boolean, isCurrent: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .background(
                    if (isDone) EmeraldPrimary else Slate200,
                    RoundedCornerShape(10.dp)
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
            }
        }
        Column {
            Text(title, fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Medium, fontSize = 12.sp, color = if (isCurrent) EmeraldDark else Slate900)
            Text(subtitle, fontSize = 10.sp, color = Slate500)
        }
    }
}
