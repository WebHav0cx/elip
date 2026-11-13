from datetime import datetime, timedelta


class SimulationClock:
    def __init__(self, start_time: datetime, speed_multiplier: float = 1) -> None:
        if start_time.tzinfo is None:
            raise ValueError("Simulation clock start_time must include a timezone")
        if speed_multiplier <= 0:
            raise ValueError("Simulation clock speed_multiplier must be positive")
        self.start_time = start_time
        self.current_time = start_time
        self.speed_multiplier = speed_multiplier
        self.paused = False

    def advance(self, simulated_seconds: float) -> datetime:
        if simulated_seconds < 0:
            raise ValueError("Clock cannot advance by a negative duration")
        if not self.paused:
            self.current_time += timedelta(seconds=simulated_seconds)
        return self.current_time

    def pause(self) -> None:
        self.paused = True

    def resume(self) -> None:
        self.paused = False

    def reset(self) -> None:
        self.current_time = self.start_time
        self.paused = False
