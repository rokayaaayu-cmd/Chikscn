package com.livecount.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import org.json.JSONArray
import org.json.JSONObject

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "livecount_data")

class DataRepository(private val context: Context) {
    private val modelsKey = stringPreferencesKey("models")
    private val datasetsKey = stringPreferencesKey("datasets")
    private val testResultsKey = stringPreferencesKey("test_results")

    // Models
    fun getModels(): Flow<List<ModelInfo>> = context.dataStore.data.map { preferences ->
        val json = preferences[modelsKey] ?: "[]"
        parseModels(json)
    }

    suspend fun saveModels(models: List<ModelInfo>) {
        context.dataStore.edit { preferences ->
            preferences[modelsKey] = serializeModels(models)
        }
    }

    suspend fun addModel(model: ModelInfo) {
        val current = getModelsSync()
        saveModels(current + model)
    }

    suspend fun updateModel(model: ModelInfo) {
        val current = getModelsSync().toMutableList()
        val index = current.indexOfFirst { it.id == model.id }
        if (index >= 0) {
            current[index] = model
            saveModels(current)
        }
    }

    suspend fun deleteModel(id: String) {
        val current = getModelsSync()
        saveModels(current.filter { it.id != id })
    }

    private suspend fun getModelsSync(): List<ModelInfo> {
        var models = emptyList<ModelInfo>()
        context.dataStore.data.map { it[modelsKey] ?: "[]" }.collect {
            models = parseModels(it)
        }
        return models
    }

    // Datasets
    fun getDatasets(): Flow<List<TrainingDataset>> = context.dataStore.data.map { preferences ->
        val json = preferences[datasetsKey] ?: "[]"
        parseDatasets(json)
    }

    suspend fun saveDatasets(datasets: List<TrainingDataset>) {
        context.dataStore.edit { preferences ->
            preferences[datasetsKey] = serializeDatasets(datasets)
        }
    }

    suspend fun addDataset(dataset: TrainingDataset) {
        val current = getDatasetsSync()
        saveDatasets(current + dataset)
    }

    suspend fun deleteDataset(id: String) {
        val current = getDatasetsSync()
        saveDatasets(current.filter { it.id != id })
    }

    private suspend fun getDatasetsSync(): List<TrainingDataset> {
        var datasets = emptyList<TrainingDataset>()
        context.dataStore.data.map { it[datasetsKey] ?: "[]" }.collect {
            datasets = parseDatasets(it)
        }
        return datasets
    }

    // Test Results
    fun getTestResults(): Flow<List<TestResult>> = context.dataStore.data.map { preferences ->
        val json = preferences[testResultsKey] ?: "[]"
        parseTestResults(json)
    }

    suspend fun saveTestResults(results: List<TestResult>) {
        context.dataStore.edit { preferences ->
            preferences[testResultsKey] = serializeTestResults(results)
        }
    }

    suspend fun addTestResult(result: TestResult) {
        val current = getTestResultsSync()
        saveTestResults(current + result)
    }

    private suspend fun getTestResultsSync(): List<TestResult> {
        var results = emptyList<TestResult>()
        context.dataStore.data.map { it[testResultsKey] ?: "[]" }.collect {
            results = parseTestResults(it)
        }
        return results
    }

    // Serialization helpers
    private fun serializeModels(models: List<ModelInfo>): String {
        val array = JSONArray()
        models.forEach { model ->
            val obj = JSONObject().apply {
                put("id", model.id)
                put("name", model.name)
                put("version", model.version)
                put("type", model.type)
                put("size", model.size)
                put("accuracy", model.accuracy)
                put("inferenceTime", model.inferenceTime)
                put("status", model.status)
            }
            array.put(obj)
        }
        return array.toString()
    }

    private fun parseModels(json: String): List<ModelInfo> {
        val array = JSONArray(json)
        return (0 until array.length()).map { i ->
            val obj = array.getJSONObject(i)
            ModelInfo(
                id = obj.getString("id"),
                name = obj.getString("name"),
                version = obj.getString("version"),
                type = obj.getString("type"),
                size = obj.getString("size"),
                accuracy = obj.getDouble("accuracy").toFloat(),
                inferenceTime = obj.getInt("inferenceTime"),
                status = obj.getString("status")
            )
        }
    }

    private fun serializeDatasets(datasets: List<TrainingDataset>): String {
        val array = JSONArray()
        datasets.forEach { dataset ->
            val obj = JSONObject().apply {
                put("id", dataset.id)
                put("name", dataset.name)
                put("images", dataset.images)
                put("annotations", dataset.annotations)
                put("classes", JSONArray(dataset.classes))
                put("createdAt", dataset.createdAt)
                put("size", dataset.size)
                put("status", dataset.status)
            }
            array.put(obj)
        }
        return array.toString()
    }

    private fun parseDatasets(json: String): List<TrainingDataset> {
        val array = JSONArray(json)
        return (0 until array.length()).map { i ->
            val obj = array.getJSONObject(i)
            val classesArray = obj.getJSONArray("classes")
            val classes = (0 until classesArray.length()).map { classesArray.getString(it) }
            TrainingDataset(
                id = obj.getString("id"),
                name = obj.getString("name"),
                images = obj.getInt("images"),
                annotations = obj.getInt("annotations"),
                classes = classes,
                createdAt = obj.getLong("createdAt"),
                size = obj.getString("size"),
                status = obj.getString("status")
            )
        }
    }

    private fun serializeTestResults(results: List<TestResult>): String {
        val array = JSONArray()
        results.forEach { result ->
            val obj = JSONObject().apply {
                put("id", result.id)
                put("modelId", result.modelId)
                put("datasetId", result.datasetId)
                put("timestamp", result.timestamp)
                put("mAP", result.mAP)
                put("precision", result.precision)
                put("recall", result.recall)
                put("f1Score", result.f1Score)
                put("inferenceTime", result.inferenceTime)
                put("fps", result.fps)
                put("totalImages", result.totalImages)
                put("correctDetections", result.correctDetections)
                put("falsePositives", result.falsePositives)
                put("falseNegatives", result.falseNegatives)
            }
            array.put(obj)
        }
        return array.toString()
    }

    private fun parseTestResults(json: String): List<TestResult> {
        val array = JSONArray(json)
        return (0 until array.length()).map { i ->
            val obj = array.getJSONObject(i)
            TestResult(
                id = obj.getString("id"),
                modelId = obj.getString("modelId"),
                datasetId = obj.getString("datasetId"),
                timestamp = obj.getLong("timestamp"),
                mAP = obj.getDouble("mAP").toFloat(),
                precision = obj.getDouble("precision").toFloat(),
                recall = obj.getDouble("recall").toFloat(),
                f1Score = obj.getDouble("f1Score").toFloat(),
                inferenceTime = obj.getDouble("inferenceTime").toFloat(),
                fps = obj.getDouble("fps").toFloat(),
                totalImages = obj.getInt("totalImages"),
                correctDetections = obj.getInt("correctDetections"),
                falsePositives = obj.getInt("falsePositives"),
                falseNegatives = obj.getInt("falseNegatives")
            )
        }
    }
}
