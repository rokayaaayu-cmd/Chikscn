package com.livecount.app.data

/**
 * Data models for the Live Count application.
 */

data class ModelInfo(
    val id: String,
    val name: String,
    val version: String,
    val type: String, // "tflite", "onnx", "tfjs"
    val size: String,
    val accuracy: Float,
    val inferenceTime: Int, // ms
    val status: String // "ready", "training", "error"
)

data class TrainingDataset(
    val id: String,
    val name: String,
    val images: Int,
    val annotations: Int,
    val classes: List<String>,
    val createdAt: Long,
    val size: String,
    val status: String // "ready", "processing", "error"
)

data class TestResult(
    val id: String,
    val modelId: String,
    val datasetId: String,
    val timestamp: Long,
    val mAP: Float,
    val precision: Float,
    val recall: Float,
    val f1Score: Float,
    val inferenceTime: Float,
    val fps: Float,
    val totalImages: Int,
    val correctDetections: Int,
    val falsePositives: Int,
    val falseNegatives: Int
)

data class SessionRecord(
    val id: String,
    val date: Long,
    val duration: String,
    val totalCount: Int,
    val manual: Int,
    val avgConfidence: Float,
    val fps: Int,
    val status: String
)

data class SessionState(
    val totalCount: Int = 0,
    val manualCorrection: Int = 0,
    val sessionTime: Int = 0,
    val isRunning: Boolean = false,
    val fps: Int = 0,
    val activeTracks: Int = 0
)

data class AppSettings(
    val confidenceThreshold: Float = 0.5f,
    val iouThreshold: Float = 0.3f,
    val maxTrackAge: Int = 5000,
    val minDetectionArea: Int = 500,
    val maxDetectionArea: Int = 50000,
    val countingLinePosition: Int = 50,
    val enableTracking: Boolean = true,
    val enableZones: Boolean = true,
    val showConfidence: Boolean = true,
    val showTrackIds: Boolean = true,
    val showBoundingBoxes: Boolean = true,
    val cameraFacing: String = "back",
    val resolution: String = "640x480",
    val targetClass: String = "chicken"
)
