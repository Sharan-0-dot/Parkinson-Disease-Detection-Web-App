import torch.nn as nn


class Net(nn.Module):
    """Simple MLP for Parkinson's voice feature classification. Must match FL training exactly."""

    def __init__(self, input_dim: int = 21):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 32), nn.ReLU(),
            nn.Linear(32, 16), nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.net(x)