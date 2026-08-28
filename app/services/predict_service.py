from functools import lru_cache

import joblib
import torch

from app.config import settings
from app.ml.net import Net


@lru_cache(maxsize=1)
def get_model() -> Net:
    model = Net(input_dim=21)
    model.load_state_dict(torch.load(settings.MODEL_PATH, map_location=torch.device("cpu")))
    model.eval()
    return model


@lru_cache(maxsize=1)
def get_scaler():
    return joblib.load(settings.SCALER_PATH)


def run_inference(raw_features) -> tuple[float, int]:
    scaler = get_scaler()
    model = get_model()

    features_scaled = scaler.transform(raw_features.reshape(1, -1))
    input_tensor = torch.tensor(features_scaled, dtype=torch.float32)

    with torch.no_grad():
        logit = model(input_tensor)
        prob = torch.sigmoid(logit).item()
        pred_class = 1 if prob >= 0.5 else 0

    return prob, pred_class