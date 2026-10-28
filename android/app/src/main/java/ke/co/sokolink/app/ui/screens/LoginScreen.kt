package ke.co.sokolink.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Store
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ke.co.sokolink.app.ui.theme.*

@Composable
fun LoginScreen(
    onLoginSuccess: (String) -> Unit // returns role: "CUSTOMER" or "DELIVERY" or "SME"
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var selectedRole by remember { mutableStateOf("CUSTOMER") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate50)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(64.dp).background(EmeraldPrimary, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.Store, contentDescription = null, tint = Color.White, modifier = Modifier.size(36.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("SokoLink Kenya", fontWeight = FontWeight.Black, fontSize = 24.sp, color = Slate900)
        Text("Sign in to access your portal", fontSize = 12.sp, color = Slate500)

        Spacer(modifier = Modifier.height(24.dp))

        // Role Selector Chips
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
                selected = selectedRole == "CUSTOMER",
                onClick = {
                    selectedRole = "CUSTOMER"
                    email = "wambui.kamau@gmail.com"
                    password = "Customer@2026!"
                },
                label = { Text("Customer") }
            )
            FilterChip(
                selected = selectedRole == "DELIVERY",
                onClick = {
                    selectedRole = "DELIVERY"
                    email = "rider@sokolink.co.ke"
                    password = "Rider@2026!"
                },
                label = { Text("Courier") }
            )
            FilterChip(
                selected = selectedRole == "SME",
                onClick = {
                    selectedRole = "SME"
                    email = "kazi@nairobielectronics.co.ke"
                    password = "Sme@2026!"
                },
                label = { Text("SME Seller") }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address") },
            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = {
                onLoginSuccess(selectedRole)
            },
            colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp)
        ) {
            Text("Sign In to SokoLink", fontWeight = FontWeight.Bold)
        }
    }
}
