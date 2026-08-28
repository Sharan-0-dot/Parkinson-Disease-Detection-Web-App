import math
import numpy as np
import parselmouth
from parselmouth.praat import call
from pydub import AudioSegment


def ensure_wav(input_path: str, output_path: str) -> float:
    """Convert any browser-recorded/uploaded audio format to WAV for Praat.

    Returns the clip duration in seconds.
    """
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1)  # mono, matches training data assumptions
    audio.export(output_path, format="wav")
    return round(len(audio) / 1000.0, 2)


def calculate_rpde(signal, eps=0.1):
    try:
        n = len(signal)
        if n < 500:
            return 0.54
        sub_sig = signal[::int(max(1, n / 2000))].astype(float)
        diff = np.abs(np.subtract.outer(sub_sig, sub_sig))
        recurrence = (diff < eps).astype(int)
        diag_sums = [np.sum(np.diag(recurrence, k=k)) for k in range(1, len(sub_sig))]
        diag_sums = np.array(diag_sums) / (np.sum(diag_sums) + 1e-10)
        diag_sums = diag_sums[diag_sums > 0]
        entropy = -np.sum(diag_sums * np.log2(diag_sums)) / np.log2(len(sub_sig))
        return float(np.clip(entropy, 0.1, 0.9))
    except Exception:
        return 0.54


def calculate_dfa(signal):
    try:
        sig = signal[::int(max(1, len(signal) / 4000))].astype(float)
        y = np.cumsum(sig - np.mean(sig))
        scales = np.unique(np.logspace(np.log10(10), np.log10(len(y) // 4), num=15).astype(int))
        fluct = []
        for s in scales:
            if s <= 2 or s >= len(y):
                continue
            num_segments = len(y) // s
            if num_segments == 0:
                continue
            reshaped = y[:num_segments * s].reshape((num_segments, s))
            x_axis = np.arange(s)
            poly = np.polyfit(x_axis, reshaped.T, 1)
            trend = (poly[0][:, None] * x_axis + poly[1][:, None])
            f = np.sqrt(np.mean((reshaped - trend) ** 2))
            fluct.append(f)

        if len(fluct) < 3:
            return 0.65
        scales_log = np.log(scales[:len(fluct)])
        fluct_log = np.log(np.array(fluct) + 1e-10)
        alpha = np.polyfit(scales_log, fluct_log, 1)[0]
        return float(np.clip(alpha, 0.4, 0.95))
    except Exception:
        return 0.65


def calculate_ppe(pitch_values):
    try:
        f0 = pitch_values[pitch_values > 0]
        if len(f0) < 5:
            return 0.75
        semitones = 12 * np.log2(f0 / 127.09)
        diffs = np.diff(semitones)
        prob_dist, _ = np.histogram(diffs, bins=30, density=True)
        prob_dist = prob_dist[prob_dist > 0]
        entropy = -np.sum(prob_dist * np.log2(prob_dist + 1e-10)) / 10.0
        return float(np.clip(entropy, 0.1, 0.95))
    except Exception:
        return 0.75


def extract_21_features(audio_path: str) -> np.ndarray:
    sound = parselmouth.Sound(audio_path)

    pitch = sound.to_pitch()
    pulses = call([sound, pitch], "To PointProcess (cc)")
    pitch_values = pitch.selected_array["frequency"]

    harmonicity_cc = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
    mean_hnr = call(harmonicity_cc, "Get mean", 0, 0)
    if math.isnan(mean_hnr):
        mean_hnr = 18.0

    mean_nhr = 1.0 / (10 ** (mean_hnr / 10.0)) if mean_hnr > 0 else 0.02
    mean_autocorr = 1.0 / (1.0 + mean_nhr)

    num_pulses = float(call(pulses, "Get number of points"))
    num_periods = float(call(pulses, "Get number of periods", 0.0, 0.0, 0.0001, 0.02, 1.3))
    mean_period = float(call(pulses, "Get mean period", 0.0, 0.0, 0.0001, 0.02, 1.3))
    std_period = float(call(pulses, "Get stdev period", 0.0, 0.0, 0.0001, 0.02, 1.3))

    if math.isnan(mean_period):
        mean_period = 0.006
    if math.isnan(std_period):
        std_period = 0.0001

    loc_jitter = float(call(pulses, "Get jitter (local)", 0.0, 0.0, 0.0001, 0.02, 1.3))
    loc_abs_jitter = float(call(pulses, "Get jitter (local, absolute)", 0.0, 0.0, 0.0001, 0.02, 1.3))
    rap_jitter = float(call(pulses, "Get jitter (rap)", 0.0, 0.0, 0.0001, 0.02, 1.3))
    ppq5_jitter = float(call(pulses, "Get jitter (ppq5)", 0.0, 0.0, 0.0001, 0.02, 1.3))
    ddp_jitter = float(call(pulses, "Get jitter (ddp)", 0.0, 0.0, 0.0001, 0.02, 1.3))

    loc_shimmer = float(call([sound, pulses], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    loc_db_shimmer = float(call([sound, pulses], "Get shimmer (local_dB)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    apq3_shimmer = float(call([sound, pulses], "Get shimmer (apq3)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    apq5_shimmer = float(call([sound, pulses], "Get shimmer (apq5)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    apq11_shimmer = float(call([sound, pulses], "Get shimmer (apq11)", 0, 0, 0.0001, 0.02, 1.3, 1.6))
    dda_shimmer = float(call([sound, pulses], "Get shimmer (dda)", 0, 0, 0.0001, 0.02, 1.3, 1.6))

    raw_signal = sound.values[0]
    dfa_val = calculate_dfa(raw_signal)
    rpde_val = calculate_rpde(raw_signal)
    ppe_val = calculate_ppe(pitch_values)

    feature_vector = np.array([
        ppe_val, dfa_val, rpde_val,
        num_pulses, num_periods, mean_period, std_period,
        loc_jitter, loc_abs_jitter, rap_jitter, ppq5_jitter, ddp_jitter,
        loc_shimmer, loc_db_shimmer, apq3_shimmer, apq5_shimmer, apq11_shimmer, dda_shimmer,
        mean_autocorr, mean_nhr, mean_hnr,
    ], dtype=np.float32)

    return np.nan_to_num(feature_vector, nan=0.0)