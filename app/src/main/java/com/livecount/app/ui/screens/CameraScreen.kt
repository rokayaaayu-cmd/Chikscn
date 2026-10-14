package com.livecount.app.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.livecount.app.detection.ChickenDetector
import com.livecount.app.detection.ObjectTracker
import com.livecount.app.detection.Detection
import com.livecount.app.detection.CountingZone
import com.livecount.app.data.SessionState
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference
import kotlin.math.max

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CameraScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context, Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> hasCameraPermission = granted }

    var isRunning by remember { mutableStateOf(true) } // Auto-start camera
    var totalCount by remember { mutableStateOf(0) }
    var manualCorrection by remember { mutableStateOf(0) }
    var fps by remember { mutableStateOf(0) }
    var sessionTime by remember { mutableStateOf(0) }
    var activeTracks by remember { mutableStateOf(0) }
    var detections by remember { mutableStateOf<List<Detection>>(emptyList()) }
    var zones by remember {
        mutableStateOf(
            listOf(
                CountingZone("zone1", "Zone A", 0.1f, 0.3f, 0.35f, 0.4f, 0, Color(0xFF22C55E), true),
                CountingZone("zone2", "Zone B", 0.55f, 0.3f, 0.35f, 0.4f, 0, Color(0xFFEAB308), true)
            )
        )
    }

    var showBoxes by remember { mutableStateOf(true) }
    var showIds by remember { mutableStateOf(true) }
    var showZones by remember { mutableStateOf(true) }
    var confidence by remember { mutableStateOf(0.5f) }

    val detector = remember { ChickenDetector(context) }
    val tracker = remember { ObjectTracker() }
    val isProcessing = remember { AtomicBoolean(false) }
    val previewViewRef = remember { androidx.compose.runtime.mutableStateOf<PreviewView?>(null) }
    val cameraBound = remember { mutableStateOf(false) }

    // Atomic references so the analyzer closure always reads the latest values
    val latestZones = remember { AtomicReference(zones) }
    val latestConfidence = remember { AtomicReference(confidence) }
    val latestShowZones = remember { AtomicReference(showZones) }

    // Keep atomic refs in sync with composable state
    LaunchedEffect(zones) { latestZones.set(zones) }
    LaunchedEffect(confidence) { latestConfidence.set(confidence) }
    LaunchedEffect(showZones) { latestShowZones.set(showZones) }

    // Session timer
    LaunchedEffect(isRunning) {
        if (isRunning) {
            while (true) {
                kotlinx.coroutines.delay(1000)
                sessionTime++
            }
        }
    }

    // FPS counter
    LaunchedEffect(isRunning) {
        if (isRunning) {
            var frameCount = 0
            var lastTime = System.currentTimeMillis()
            while (true) {
                kotlinx.coroutines.delay(100)
                frameCount++
                val now = System.currentTimeMillis()
                if (now - lastTime >= 1000) {
                    fps = frameCount
                    frameCount = 0
                    lastTime = now
                }
            }
        }
    }

    // Bind camera ONCE when isRunning becomes true
    LaunchedEffect(isRunning, hasCameraPermission) {
        if (isRunning && hasCameraPermission && !cameraBound.value) {
            val previewView = previewViewRef.value ?: return@LaunchedEffect
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                try {
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }
                    val imageAnalyzer = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(cameraExecutor) { imageProxy ->
                                if (!isProcessing.getAndSet(true)) {
                                    processFrame(
                                        imageProxy, detector, tracker,
                                        latestZones.get(),
                                        latestConfidence.get(),
                                        latestShowZones.get()
                                    ) { newDetections, newZones, trackCount ->
                                        detections = newDetections
                                        zones = newZones
                                        activeTracks = trackCount
                                        isProcessing.set(false)
                                    }
                                } else {
                                    imageProxy.close()
                                }
                            }
                        }

                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview, imageAnalyzer
                    )
                    cameraBound.value = true
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }, ContextCompat.getMainExecutor(context))
        } else if (!isRunning && cameraBound.value) {
            // Unbind camera when stopped
            val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
            cameraProviderFuture.addListener({
                try {
                    val cameraProvider = cameraProviderFuture.get()
                    cameraProvider.unbindAll()
                    cameraBound.value = false
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }, ContextCompat.getMainExecutor(context))
        }
    }

    // Auto-request camera permission on launch
    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Stats bar
        StatsBar(totalCount, manualCorrection, activeTracks, fps, sessionTime, isRunning)

        // Camera preview
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color.Black)
        ) {
            if (!hasCameraPermission) {
                PermissionRequestCard(onRequest = {
                    permissionLauncher.launch(Manifest.permission.CAMERA)
                })
            } else {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).apply {
                            scaleType = PreviewView.ScaleType.FILL_CENTER
                            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                            previewViewRef.value = this
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                    // No update block - camera is bound via LaunchedEffect to prevent flickering
                )

                // Overlay: bounding boxes and zones
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val w = size.width
                    val h = size.height

                    // Draw zones
                    if (showZones) {
                        zones.forEach { zone ->
                            if (zone.active) {
                                val x = zone.x * w
                                val y = zone.y * h
                                val zw = zone.width * w
                                val zh = zone.height * h
                                drawRect(
                                    color = zone.color.copy(alpha = 0.15f),
                                    topLeft = Offset(x, y),
                                    size = Size(zw, zh)
                                )
                                drawRect(
                                    color = zone.color,
                                    topLeft = Offset(x, y),
                                    size = Size(zw, zh),
                                    style = Stroke(width = 2f)
                                )
                            }
                        }
                    }

                    // Draw detections - only ACTIVE ones with valid bounding boxes
                    if (showBoxes) {
                        detections.filter { det ->
                            det.status == Detection.Status.ACTIVE &&
                            det.bbox[2] > 0.01f && det.bbox[3] > 0.01f && // Min size threshold
                            det.bbox[2] < 0.95f && det.bbox[3] < 0.95f    // Max size threshold
                        }.forEach { det ->
                            val color = when (det.status) {
                                Detection.Status.ACTIVE -> Color(0xFF22C55E)
                                Detection.Status.OCCLUDED -> Color(0xFFEAB308)
                                Detection.Status.LOST -> Color(0xFFEF4444)
                            }
                            val finalColor = if (det.counted) Color(0xFF3B82F6) else color

                            val x = det.bbox[0] * w
                            val y = det.bbox[1] * h
                            val bw = det.bbox[2] * w
                            val bh = det.bbox[3] * h

                            drawRect(
                                color = finalColor,
                                topLeft = Offset(x, y),
                                size = Size(bw, bh),
                                style = Stroke(width = 3f)
                            )
                        }
                    }
                }

                // Detection labels overlay
                Column(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                ) {
                    detections.filter { it.status == Detection.Status.ACTIVE }
                        .take(5)
                        .forEach { det ->
                            val color = when (det.status) {
                                Detection.Status.ACTIVE -> Color(0xFF22C55E)
                                Detection.Status.OCCLUDED -> Color(0xFFEAB308)
                                Detection.Status.LOST -> Color(0xFFEF4444)
                            }
                            val label = if (showIds) {
                                "#${det.trackId} ${(det.score * 100).toInt()}%"
                            } else {
                                "${(det.score * 100).toInt()}%"
                            }
                            Text(
                                text = label,
                                color = Color.White,
                                fontSize = 10.sp,
                                modifier = Modifier
                                    .background(color.copy(alpha = 0.8f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                }
            }
        }

        // Controls
        ControlsBar(
            isRunning = isRunning,
            onStartStop = {
                if (isRunning) {
                    isRunning = false
                } else {
                    if (!hasCameraPermission) {
                        permissionLauncher.launch(Manifest.permission.CAMERA)
                    } else {
                        isRunning = true
                    }
                }
            },
            onReset = {
                totalCount = 0
                manualCorrection = 0
                sessionTime = 0
                detections = emptyList()
                tracker.clear()
                zones = zones.map { it.copy(count = 0) }
            },
            manualCorrection = manualCorrection,
            onManualAdjust = { delta -> manualCorrection += delta },
            showBoxes = showBoxes,
            onToggleBoxes = { showBoxes = it },
            showIds = showIds,
            onToggleIds = { showIds = it },
            showZones = showZones,
            onToggleZones = { showZones = it },
            confidence = confidence,
            onConfidenceChange = { confidence = it }
        )
    }
}

private fun processFrame(
    imageProxy: ImageProxy,
    detector: ChickenDetector,
    tracker: ObjectTracker,
    zones: List<CountingZone>,
    confidence: Float,
    showZones: Boolean,
    onResult: (List<Detection>, List<CountingZone>, Int) -> Unit
) {
    try {
        val bitmap = imageProxy.toBitmap()
        val results = detector.detect(bitmap, confidence)
        val tracked = tracker.update(results)
        var updatedZones = zones

        if (showZones) {
            updatedZones = zones.map { zone ->
                var count = zone.count
                tracked.forEach { det ->
                    if (!det.counted && zone.contains(det.bbox[0] + det.bbox[2] / 2, det.bbox[1] + det.bbox[3] / 2)) {
                        det.counted = true
                        count++
                    }
                }
                zone.copy(count = count)
            }
        }

        onResult(tracked, updatedZones, tracked.count { it.status != Detection.Status.LOST })
    } catch (e: Exception) {
        e.printStackTrace()
        onResult(emptyList(), zones, 0)
    } finally {
        imageProxy.close()
    }
}

@Composable
fun StatsBar(totalCount: Int, manualCorrection: Int, activeTracks: Int, fps: Int, sessionTime: Int, isRunning: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            StatItem("${totalCount + manualCorrection}", "Total", Color(0xFF22C55E))
            StatItem("$activeTracks", "Active", Color(0xFF3B82F6))
            StatItem("$fps", "FPS", Color(0xFFEAB308))
            StatItem(formatTime(sessionTime), "Session", Color(0xFFA855F7))
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isRunning) Color(0xFF22C55E) else Color.Gray)
            )
            Spacer(Modifier.width(4.dp))
            Text(if (isRunning) "LIVE" else "IDLE", fontSize = 10.sp, color = Color.Gray)
        }
    }
}

@Composable
fun StatItem(value: String, label: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = if (label == "Total") 20.sp else 16.sp, fontWeight = FontWeight.Bold, color = color)
        Text(label, fontSize = 9.sp, color = Color.Gray)
    }
}

@Composable
fun PermissionRequestCard(onRequest: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Card(
            modifier = Modifier.padding(32.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(Icons.Default.Camera, "Camera", modifier = Modifier.size(48.dp), tint = Color(0xFFEF4444))
                Spacer(Modifier.height(16.dp))
                Text("Camera Permission Required", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text("Live Count needs camera access to detect and count chickens in real-time.", fontSize = 12.sp, color = Color.Gray)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRequest) {
                    Icon(Icons.Default.Camera, "Grant")
                    Spacer(Modifier.width(8.dp))
                    Text("Grant Permission")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ControlsBar(
    isRunning: Boolean,
    onStartStop: () -> Unit,
    onReset: () -> Unit,
    manualCorrection: Int,
    onManualAdjust: (Int) -> Unit,
    showBoxes: Boolean,
    onToggleBoxes: (Boolean) -> Unit,
    showIds: Boolean,
    onToggleIds: (Boolean) -> Unit,
    showZones: Boolean,
    onToggleZones: (Boolean) -> Unit,
    confidence: Float,
    onConfidenceChange: (Float) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onStartStop,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isRunning) Color(0xFFDC2626) else Color(0xFF22C55E)
                    ),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Icon(
                        if (isRunning) Icons.Default.Pause else Icons.Default.PlayArrow,
                        "Toggle",
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(if (isRunning) "Stop" else "Start", fontSize = 11.sp)
                }
                OutlinedButton(
                    onClick = onReset,
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Icon(Icons.Default.Refresh, "Reset", modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Reset", fontSize = 11.sp)
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { onManualAdjust(-1) }, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Remove, "Decrease", modifier = Modifier.size(14.dp))
                }
                Text("±$manualCorrection", fontSize = 11.sp, modifier = Modifier.width(40.dp))
                IconButton(onClick = { onManualAdjust(1) }, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Add, "Increase", modifier = Modifier.size(14.dp))
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            FilterChip(
                selected = showBoxes,
                onClick = { onToggleBoxes(!showBoxes) },
                label = { Text("Boxes", fontSize = 10.sp) },
                modifier = Modifier.height(28.dp)
            )
            FilterChip(
                selected = showIds,
                onClick = { onToggleIds(!showIds) },
                label = { Text("IDs", fontSize = 10.sp) },
                modifier = Modifier.height(28.dp)
            )
            FilterChip(
                selected = showZones,
                onClick = { onToggleZones(!showZones) },
                label = { Text("Zones", fontSize = 10.sp) },
                modifier = Modifier.height(28.dp)
            )
            Spacer(Modifier.weight(1f))
            Text("Conf:", fontSize = 9.sp, color = Color.Gray)
            Slider(
                value = confidence,
                onValueChange = onConfidenceChange,
                valueRange = 0.1f..0.9f,
                steps = 7,
                modifier = Modifier.width(80.dp).height(24.dp)
            )
            Text("${(confidence * 100).toInt()}%", fontSize = 9.sp, color = Color.Gray)
        }
    }
}

fun formatTime(seconds: Int): String {
    val m = seconds / 60
    val s = seconds % 60
    return "${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}"
}
