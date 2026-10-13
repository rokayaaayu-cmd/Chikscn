package com.livecount.app.detection

import kotlin.math.max
import kotlin.math.min

/**
 * Represents a single detection in a frame.
 */
data class Detection(
    val trackId: Int,
    val bbox: FloatArray, // [x, y, width, height] normalized
    val score: Float,
    val className: String,
    var status: Status = Status.ACTIVE,
    var counted: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
) {
    enum class Status { ACTIVE, OCCLUDED, LOST }

    val centerX: Float get() = bbox[0] + bbox[2] / 2f
    val centerY: Float get() = bbox[1] + bbox[3] / 2f

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Detection) return false
        return trackId == other.trackId
    }

    override fun hashCode(): Int = trackId
}

/**
 * Multi-object tracker using IoU-based matching.
 * Assigns unique track IDs and maintains tracking state across frames.
 */
class ObjectTracker(
    private val iouThreshold: Float = 0.3f,
    private val maxAge: Long = 5000L // ms before track is removed
) {
    private data class Track(
        val id: Int,
        var lastDetection: Detection,
        var lastSeen: Long,
        val history: MutableList<Detection> = mutableListOf(),
        val path: MutableList<Pair<Float, Float>> = mutableListOf()
    )

    private val tracks = mutableMapOf<Int, Track>()
    private var nextId = 1

    /**
     * Update tracker with new detections from current frame.
     * Matches detections to existing tracks using IoU, creates new tracks for unmatched detections,
     * and marks old tracks as occluded/lost.
     */
    fun update(rawDetections: List<ChickenDetector.RawDetection>): List<Detection> {
        val now = System.currentTimeMillis()
        val matchedTrackIds = mutableSetOf<Int>()
        val resultDetections = mutableListOf<Detection>()

        // Match each detection to existing tracks
        rawDetections.forEach { raw ->
            var bestMatch: Int? = null
            var bestIoU = iouThreshold

            tracks.forEach { (trackId, track) ->
                val iou = calculateIoU(raw.bbox, track.lastDetection.bbox)
                if (iou > bestIoU) {
                    bestIoU = iou
                    bestMatch = trackId
                }
            }

            if (bestMatch != null) {
                // Update existing track
                val track = tracks[bestMatch!!]!!
                val detection = Detection(
                    trackId = bestMatch!!,
                    bbox = raw.bbox,
                    score = raw.score,
                    className = raw.className,
                    status = Detection.Status.ACTIVE,
                    counted = track.lastDetection.counted
                )
                track.lastDetection = detection
                track.lastSeen = now
                track.history.add(detection)
                track.path.add(raw.centerX to raw.centerY)
                if (track.path.size > 50) track.path.removeAt(0)
                matchedTrackIds.add(bestMatch!!)
                resultDetections.add(detection)
            } else {
                // Create new track
                val newId = nextId++
                val detection = Detection(
                    trackId = newId,
                    bbox = raw.bbox,
                    score = raw.score,
                    className = raw.className,
                    status = Detection.Status.ACTIVE
                )
                tracks[newId] = Track(
                    id = newId,
                    lastDetection = detection,
                    lastSeen = now,
                    history = mutableListOf(detection),
                    path = mutableListOf(raw.centerX to raw.centerY)
                )
                resultDetections.add(detection)
            }
        }

        // Mark unmatched tracks
        tracks.forEach { (trackId, track) ->
            if (trackId !in matchedTrackIds) {
                val age = now - track.lastSeen
                if (age > 2000) {
                    track.lastDetection = track.lastDetection.copy(status = Detection.Status.LOST)
                } else {
                    track.lastDetection = track.lastDetection.copy(status = Detection.Status.OCCLUDED)
                }
                resultDetections.add(track.lastDetection)
            }
        }

        // Remove very old tracks
        tracks.entries.removeAll { (trackId, track) ->
            now - track.lastSeen > maxAge
        }

        return resultDetections
    }

    /**
     * Calculate Intersection over Union between two bounding boxes.
     */
    private fun calculateIoU(box1: FloatArray, box2: FloatArray): Float {
        val x1 = max(box1[0], box2[0])
        val y1 = max(box1[1], box2[1])
        val x2 = min(box1[0] + box1[2], box2[0] + box2[2])
        val y2 = min(box1[1] + box1[3], box2[1] + box2[3])

        val intersection = max(0f, x2 - x1) * max(0f, y2 - y1)
        val area1 = box1[2] * box1[3]
        val area2 = box2[2] * box2[3]
        val union = area1 + area2 - intersection

        return if (union > 0) intersection / union else 0f
    }

    fun clear() {
        tracks.clear()
        nextId = 1
    }

    fun getTrackCount(): Int = tracks.size
}

/**
 * Counting zone for region-based counting.
 */
data class CountingZone(
    val id: String,
    val name: String,
    val x: Float,       // normalized 0-1
    val y: Float,       // normalized 0-1
    val width: Float,   // normalized 0-1
    val height: Float,  // normalized 0-1
    val count: Int,
    val color: androidx.compose.ui.graphics.Color,
    val active: Boolean
) {
    /**
     * Check if a normalized point is inside this zone.
     */
    fun contains(px: Float, py: Float): Boolean {
        return px >= x && px <= x + width && py >= y && py <= y + height
    }
}
