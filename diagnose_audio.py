from pathlib import Path
import librosa
import numpy as np

TEST_DIR = Path("ml-training/audio/dataset/test_data")

for audio_path in sorted(TEST_DIR.glob("*.wav")):
    y, sr = librosa.load(audio_path, sr=16000, mono=True)

    print("\n" + "=" * 60)
    print(audio_path.name)
    print("=" * 60)

    print(f"Sample rate: {sr}")
    print(f"Duration:    {len(y) / sr:.2f} sec")
    print(f"RMS:         {np.sqrt(np.mean(y ** 2)):.6f}")
    print(f"Peak:        {np.max(np.abs(y)):.6f}")