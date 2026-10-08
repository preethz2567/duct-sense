from core.audio_inference import predict_audio

audio_file = r"C:\Users\jyo6n\duct-sense\ml-training\audio\dataset\test_data\test-4.wav"

result = predict_audio(audio_file)

print("Prediction:", result["label"])
print("Audio confidence:", result["audio_confidence"])