package com.livecount.app.detection

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.task.vision.detector.ObjectDetector
import org.tensorflow.lite.task.vision.detector.Detection as TFLiteDetection
import java.io.FileInputStream
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

/**
 * Chicken detector using TensorFlow Lite Object Detection model.
 * Wraps the TFLite Task Vision API for efficient on-device inference.
 */
class ChickenDetector(private val context: Context) {

    private var detector: ObjectDetector? = null
    private var isInitialized = false

    data class RawDetection(
        val bbox: FloatArray, // [x, y, width, height] normalized 0-1
        val score: Float,
        val className: String
    ) {
        val centerX: Float get() = bbox[0] + bbox[2] / 2f
        val centerY: Float get() = bbox[1] + bbox[3] / 2f
    }

    init {
        initializeDetector()
    }

    private fun initializeDetector() {
        try {
            // Load the TFLite model from assets
            val modelBuffer = loadModelFile("chicken_detector.tflite")
            val options = ObjectDetector.ObjectDetectorOptions.builder()
                .setMaxResults(50)
                .setScoreThreshold(0.3f)
                .build()
            detector = ObjectDetector.createFromBufferAndOptions(modelBuffer, options)
            isInitialized = true
        } catch (e: Exception) {
            // Fallback: try to download model or use bundled one
            e.printStackTrace()
            isInitialized = false
        }
    }

    private fun loadModelFile(filename: String): MappedByteBuffer {
        val fileDescriptor = context.assets.openFd(filename)
        val fileInputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val channel = fileInputStream.channel
        return channel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.startOffset, fileDescriptor.declaredLength)
    }

    /**
     * Detect chickens in the given bitmap frame.
     * @param bitmap The camera frame as a Bitmap
     * @param confidenceThreshold Minimum confidence score (0-1)
     * @return List of detections with normalized bounding boxes
     */
    fun detect(bitmap: Bitmap, confidenceThreshold: Float = 0.5f): List<RawDetection> {
        if (!isInitialized || detector == null) {
            return emptyList()
        }

        return try {
            val tensorImage = TensorImage.fromBitmap(bitmap)
            val results: List<TFLiteDetection> = detector!!.detect(tensorImage)

            results
                .filter { it.categories.any { cat -> cat.score >= confidenceThreshold } }
                .map { detection: TFLiteDetection ->
                    val bestCategory = detection.categories.maxByOrNull { it.score }!!
                    val box = detection.boundingBox
                    val imgWidth = bitmap.width.toFloat()
                    val imgHeight = bitmap.height.toFloat()

                    RawDetection(
                        bbox = floatArrayOf(
                            box.left / imgWidth,
                            box.top / imgHeight,
                            box.width() / imgWidth,
                            box.height() / imgHeight
                        ),
                        score = bestCategory.score,
                        className = bestCategory.label
                    )
                }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    fun release() {
        detector?.close()
        detector = null
        isInitialized = false
    }
}
