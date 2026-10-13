package com.livecount.app.ui.screens

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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.livecount.app.data.ModelInfo
import com.livecount.app.data.TrainingDataset
import com.livecount.app.data.TestResult
import com.livecount.app.data.SessionRecord

// ===================== TRAINING SCREEN =====================
@Composable
fun TrainingScreen() {
    var datasets by remember {
        mutableStateOf(
            listOf(
                TrainingDataset("1", "Broiler Dataset v1", 2500, 8420, listOf("chicken", "feeder", "waterer"), System.currentTimeMillis() - 604800000, "1.2 GB", "ready"),
                TrainingDataset("2", "Overlap Cases", 800, 1200, listOf("chicken-overlapping", "chicken-group"), System.currentTimeMillis() - 259200000, "450 MB", "ready"),
                TrainingDataset("3", "Occlusion Scenarios", 500, 680, listOf("chicken-partial", "chicken-hidden"), System.currentTimeMillis() - 86400000, "280 MB", "processing")
            )
        )
    }
    var selectedDataset by remember { mutableStateOf<String?>(null) }
    var isTraining by remember { mutableStateOf(false) }
    var trainingProgress by remember { mutableFloatStateOf(0f) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Training Data & Annotation", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Button(onClick = { /* Import dataset */ }) {
                    Icon(Icons.Default.Upload, "Import")
                    Spacer(Modifier.width(8.dp))
                    Text("Import Dataset")
                }
            }
        }
        item { Text("Datasets", fontSize = 13.sp, color = Color.Gray) }
        items(datasets) { ds ->
            DatasetCard(ds, selectedDataset == ds.id, onClick = { selectedDataset = ds.id })
        }
        item {
            Spacer(Modifier.height(16.dp))
            Text("Sandbox Training", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(Modifier.height(8.dp))
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        listOf("MobileNet v2" to "Base Model", "50" to "Epochs", "0.001" to "LR", "16" to "Batch").forEach { (v, l) ->
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(v, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Text(l, fontSize = 9.sp, color = Color.Gray)
                            }
                        }
                    }
                    if (isTraining) {
                        Spacer(Modifier.height(12.dp))
                        LinearProgressIndicator(
                            progress = { trainingProgress / 100f },
                            modifier = Modifier.fillMaxWidth().height(6.dp)
                        )
                        Text("${trainingProgress.toInt()}% • Epoch ${(trainingProgress / 2).toInt()}/50", fontSize = 10.sp, color = Color.Gray)
                    }
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            isTraining = true
                            trainingProgress = 0f
                        },
                        enabled = !isTraining && selectedDataset != null,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(if (isTraining) "Training..." else "Start Training")
                    }
                }
            }
        }
    }
}

@Composable
fun DatasetCard(ds: TrainingDataset, selected: Boolean, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (selected) Color(0xFF1E3A5F) else MaterialTheme.colorScheme.surface
        ),
        border = if (selected) androidx.compose.foundation.border(1.dp, Color(0xFF3B82F6), RoundedCornerShape(12.dp)).let { null } else null
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text(ds.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Text("${ds.images} images • ${ds.annotations} annotations • ${ds.size}", fontSize = 10.sp, color = Color.Gray)
                }
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = when (ds.status) {
                        "ready" -> Color(0xFF22C55E).copy(alpha = 0.2f)
                        "processing" -> Color(0xFFEAB308).copy(alpha = 0.2f)
                        else -> Color(0xFFEF4444).copy(alpha = 0.2f)
                    }
                ) {
                    Text(ds.status, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }
            Spacer(Modifier.height(4.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                ds.classes.forEach { cls ->
                    Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF374151)) {
                        Text(cls, fontSize = 9.sp, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = Color.LightGray)
                    }
                }
            }
        }
    }
}

// ===================== MODEL MANAGER SCREEN =====================
@Composable
fun ModelManagerScreen() {
    var models by remember {
        mutableStateOf(
            listOf(
                ModelInfo("1", "COCO-SSD MobileNet v2", "1.0.0", "tfjs", "4.2 MB", 78.5f, 45, "ready"),
                ModelInfo("2", "Broiler Detector v2", "2.1.0", "tflite", "12.8 MB", 92.3f, 28, "ready"),
                ModelInfo("3", "Chicken Counter ONNX", "1.3.0", "onnx", "8.5 MB", 89.7f, 35, "ready"),
                ModelInfo("4", "Overlap Resolver", "0.9.0", "tfjs", "6.1 MB", 85.2f, 52, "training")
            )
        )
    }
    var selectedModel by remember { mutableStateOf("1") }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { Text("Model Manager", fontWeight = FontWeight.Bold, fontSize = 18.sp) }
        item {
            // Active model card
            val active = models.find { it.id == selectedModel }
            if (active != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF064E3B).copy(alpha = 0.5f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Bolt, "Active", tint = Color(0xFF22C55E), modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Active Model", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(active.name, fontWeight = FontWeight.Bold)
                        Text("v${active.version} • ${active.type.uppercase()}", fontSize = 11.sp, color = Color.Gray)
                        Spacer(Modifier.height(12.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            StatMini("${active.accuracy}%", "Accuracy", Color(0xFF22C55E))
                            StatMini("${active.inferenceTime}ms", "Inference", Color(0xFF3B82F6))
                            StatMini(active.size, "Size", Color(0xFFA855F7))
                        }
                    }
                }
            }
        }
        item { Text("Available Models", fontSize = 13.sp, color = Color.Gray) }
        items(models) { model ->
            ModelCard(model, selectedModel == model.id, onActivate = { selectedModel = model.id })
        }
    }
}

@Composable
fun StatMini(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = color)
        Text(label, fontSize = 9.sp, color = Color.Gray)
    }
}

@Composable
fun ModelCard(model: ModelInfo, isActive: Boolean, onActivate: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        border = if (isActive) androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF22C55E)) else null
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(model.name, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Spacer(Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(4.dp),
                            color = when (model.type) {
                                "tfjs" -> Color(0xFF3B82F6).copy(alpha = 0.2f)
                                "tflite" -> Color(0xFF22C55E).copy(alpha = 0.2f)
                                else -> Color(0xFFA855F7).copy(alpha = 0.2f)
                            }
                        ) {
                            Text(model.type.uppercase(), fontSize = 9.sp, modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp))
                        }
                    }
                    Text("${model.size} • ${model.inferenceTime}ms • v${model.version}", fontSize = 10.sp, color = Color.Gray)
                }
                if (!isActive && model.status == "ready") {
                    IconButton(onClick = onActivate) {
                        Icon(Icons.Default.CheckCircle, "Activate", tint = Color(0xFF22C55E))
                    }
                }
            }
            if (model.accuracy > 0) {
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { model.accuracy / 100f },
                    modifier = Modifier.fillMaxWidth().height(4.dp),
                    color = Color(0xFF22C55E)
                )
                Text("${model.accuracy}% accuracy", fontSize = 9.sp, color = Color.Gray)
            }
        }
    }
}

// ===================== TEST LAB SCREEN =====================
@Composable
fun TestLabScreen() {
    var isTesting by remember { mutableStateOf(false) }
    var testProgress by remember { mutableFloatStateOf(0f) }
    var currentStep by remember { mutableStateOf("Ready") }
    var results by remember {
        mutableStateOf(
            listOf(
                TestResult("1", "1", "1", System.currentTimeMillis() - 86400000, 0.785f, 0.82f, 0.75f, 0.78f, 45f, 22f, 500, 412, 38, 50),
                TestResult("2", "2", "1", System.currentTimeMillis() - 172800000, 0.923f, 0.94f, 0.90f, 0.92f, 28f, 35f, 500, 468, 15, 17)
            )
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { Text("Test Lab", fontWeight = FontWeight.Bold, fontSize = 18.sp) }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Model Benchmark", fontWeight = FontWeight.Bold)
                    if (isTesting) {
                        Spacer(Modifier.height(8.dp))
                        Text(currentStep, fontSize = 11.sp, color = Color.Gray)
                        LinearProgressIndicator(
                            progress = { testProgress / 100f },
                            modifier = Modifier.fillMaxWidth().height(6.dp)
                        )
                        Text("${testProgress.toInt()}%", fontSize = 10.sp, color = Color(0xFFF97316))
                    }
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = {
                            isTesting = true
                            testProgress = 0f
                        },
                        enabled = !isTesting,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.PlayArrow, "Run")
                        Spacer(Modifier.width(8.dp))
                        Text("Run Benchmark")
                    }
                }
            }
        }
        item { Text("Test History", fontSize = 13.sp, color = Color.Gray) }
        items(results) { result ->
            TestResultCard(result)
        }
    }
}

@Composable
fun TestResultCard(result: TestResult) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(java.text.SimpleDateFormat("MMM dd, HH:mm").format(java.util.Date(result.timestamp)), fontSize = 10.sp, color = Color.Gray)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        when {
                            result.mAP > 0.8f -> Icons.Default.CheckCircle
                            result.mAP > 0.6f -> Icons.Default.Warning
                            else -> Icons.Default.Cancel
                        },
                        "Status",
                        tint = when {
                            result.mAP > 0.8f -> Color(0xFF22C55E)
                            result.mAP > 0.6f -> Color(0xFFEAB308)
                            else -> Color(0xFFEF4444)
                        },
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text("mAP: ${"%.1f".format(result.mAP * 100)}%", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                StatMini("${"%.1f".format(result.precision * 100)}%", "Precision", Color(0xFF22C55E))
                StatMini("${"%.1f".format(result.recall * 100)}%", "Recall", Color(0xFF3B82F6))
                StatMini("${result.fps.toInt()}", "FPS", Color(0xFFA855F7))
                StatMini("${result.inferenceTime.toInt()}ms", "Latency", Color(0xFFF97316))
            }
            Spacer(Modifier.height(8.dp))
            Text("✓ ${result.correctDetections} correct • ⚠ ${result.falsePositives} FP • ✗ ${result.falseNegatives} FN", fontSize = 9.sp, color = Color.Gray)
        }
    }
}

// ===================== REPORTS SCREEN =====================
@Composable
fun ReportsScreen() {
    var period by remember { mutableStateOf("today") }
    val metrics = mapOf(
        "Accuracy" to "86.4%" to Color(0xFF22C55E),
        "Precision" to "88.2%" to Color(0xFF3B82F6),
        "Recall" to "83.7%" to Color(0xFFA855F7),
        "F1 Score" to "85.9%" to Color(0xFFF97316)
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Reports & Analytics", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Button(onClick = { /* Export JSON */ }, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp), modifier = Modifier.height(28.dp)) {
                        Icon(Icons.Default.Download, "JSON", modifier = Modifier.size(12.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("JSON", fontSize = 10.sp)
                    }
                    Button(onClick = { /* Export CSV */ }, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp), modifier = Modifier.height(28.dp)) {
                        Icon(Icons.Default.Download, "CSV", modifier = Modifier.size(12.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("CSV", fontSize = 10.sp)
                    }
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                listOf("today", "week", "month", "all").forEach { p ->
                    FilterChip(selected = period == p, onClick = { period = p }, label = { Text(p, fontSize = 10.sp) }, modifier = Modifier.height(28.dp))
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                metrics.entries.take(4).forEach { (label, valueColor) ->
                    val (value, color) = valueColor
                    Card(modifier = Modifier.weight(1f)) {
                        Column(modifier = Modifier.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(value, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = color)
                            Text(label, fontSize = 8.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
        item { Text("Session History", fontSize = 13.sp, color = Color.Gray) }
        items(
            listOf(
                SessionRecord("1", System.currentTimeMillis(), "00:45:23", 156, 3, 87.2f, 24, "completed"),
                SessionRecord("2", System.currentTimeMillis() - 86400000, "01:12:45", 289, 5, 84.8f, 22, "completed"),
                SessionRecord("3", System.currentTimeMillis() - 172800000, "00:32:10", 98, 1, 91.3f, 26, "completed")
            )
        ) { session ->
            SessionCard(session)
        }
    }
}

@Composable
fun SessionCard(session: SessionRecord) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(java.text.SimpleDateFormat("MMM dd, HH:mm").format(java.util.Date(session.date)), fontSize = 10.sp, color = Color.Gray)
                Surface(shape = RoundedCornerShape(4.dp), color = Color(0xFF22C55E).copy(alpha = 0.2f)) {
                    Text(session.status, fontSize = 9.sp, color = Color(0xFF22C55E), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                }
            }
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                StatMini("${session.totalCount}", "Count", Color(0xFF22C55E))
                StatMini("${session.manual}", "Manual", Color(0xFFEAB308))
                StatMini("${"%.1f".format(session.avgConfidence)}%", "Conf", Color(0xFF3B82F6))
                StatMini("${session.fps}", "FPS", Color(0xFFA855F7))
                StatMini(session.duration, "Time", Color.LightGray)
            }
        }
    }
}

// ===================== SETTINGS SCREEN =====================
@Composable
fun SettingsScreen() {
    var confidence by remember { mutableFloatStateOf(0.5f) }
    var iou by remember { mutableFloatStateOf(0.3f) }
    var maxTrackAge by remember { mutableIntStateOf(5000) }
    var cameraFacing by remember { mutableStateOf("back") }
    var resolution by remember { mutableStateOf("640x480") }
    var showBoxes by remember { mutableStateOf(true) }
    var showIds by remember { mutableStateOf(true) }
    var showConfidence by remember { mutableStateOf(true) }
    var enableTracking by remember { mutableStateOf(true) }
    var enableZones by remember { mutableStateOf(true) }
    var saved by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Settings", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = {
                        confidence = 0.5f; iou = 0.3f; maxTrackAge = 5000
                    }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp), modifier = Modifier.height(32.dp)) {
                        Text("Reset", fontSize = 11.sp)
                    }
                    Button(onClick = { saved = true }, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp), modifier = Modifier.height(32.dp)) {
                        Text(if (saved) "Saved!" else "Save", fontSize = 11.sp)
                    }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Detection Parameters", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    SettingSlider("Confidence Threshold", confidence, 0.1f..0.95f) { confidence = it }
                    SettingSlider("IoU Threshold", iou, 0.1f..0.9f) { iou = it }
                    SettingSlider("Max Track Age (ms)", maxTrackAge.toFloat(), 1000f..10000f, step = 500f) { maxTrackAge = it.toInt() }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Camera Settings", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("Camera Facing", fontSize = 11.sp, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("back", "front").forEach { f ->
                            FilterChip(selected = cameraFacing == f, onClick = { cameraFacing = f }, label = { Text("${f} camera", fontSize = 11.sp) })
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Resolution", fontSize = 11.sp, color = Color.Gray)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("320x240", "640x480", "1280x720", "1920x1080").forEach { r ->
                            FilterChip(selected = resolution == r, onClick = { resolution = r }, label = { Text(r, fontSize = 9.sp) }, modifier = Modifier.height(28.dp))
                        }
                    }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Display Settings", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(Modifier.height(12.dp))
                    SettingToggle("Show Bounding Boxes", showBoxes) { showBoxes = it }
                    SettingToggle("Show Track IDs", showIds) { showIds = it }
                    SettingToggle("Show Confidence", showConfidence) { showConfidence = it }
                    SettingToggle("Enable Tracking", enableTracking) { enableTracking = it }
                    SettingToggle("Enable Zones", enableZones) { enableZones = it }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("About", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Spacer(Modifier.height(8.dp))
                    listOf(
                        "App Version" to "1.0.0",
                        "Inference Engine" to "TensorFlow Lite",
                        "Model" to "COCO-SSD MobileNet v2",
                        "Camera" to "CameraX",
                        "UI Framework" to "Jetpack Compose",
                        "Min SDK" to "26 (Android 8.0)"
                    ).forEach { (k, v) ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(k, fontSize = 11.sp, color = Color.Gray)
                            Text(v, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SettingSlider(label: String, value: Float, range: ClosedFloatingPointRange<Float>, step: Float = 0.05f, onValueChange: (Float) -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 11.sp, color = Color.Gray)
            Text(if (value > 100) "${value.toInt()}" else "%.2f".format(value), fontSize = 11.sp, color = Color(0xFF3B82F6))
        }
        Slider(value = value, onValueChange = onValueChange, valueRange = range, steps = ((range.endInclusive - range.start) / step).toInt() - 1)
    }
}

@Composable
fun SettingToggle(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, fontSize = 11.sp, color = Color.Gray)
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}
