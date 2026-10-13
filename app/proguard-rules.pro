# Add project specific ProGuard rules here.
# TensorFlow Lite
-keep class org.tensorflow.lite.** { *; }
-keep class org.tensorflow.lite.nnapi.** { *; }

# ONNX Runtime
-keep class ai.onnxruntime.** { *; }

# Keep model classes
-keep class com.livecount.app.data.** { *; }
-keep class com.livecount.app.detection.** { *; }
