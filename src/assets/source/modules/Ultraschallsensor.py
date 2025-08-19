# calliopemini-module: Ultraschallsensor@1.0.0

from calliopemini import *
import machine
import time

_distance_backup = 20  # cm

def measure_in_cm(pin):
    global _distance_backup

    pin.write_digital(0)
    time.sleep_us(2)
    pin.write_digital(1)
    time.sleep_us(20)
    pin.write_digital(0)

    duration = machine.time_pulse_us(pin, 1, 50000)  # Timeout: 50ms (50000µs)

    if duration > 0:
        range_cm = round(duration * 153 / 29 / 2 / 100)
        _distance_backup = range_cm
    else:
        range_cm = _distance_backup

    time.sleep_ms(50)
    return range_cm

def measure_in_inch(pin):
    global _distance_backup

    pin.write_digital(0)
    time.sleep_us(2)
    pin.write_digital(1)
    time.sleep_us(20)
    pin.write_digital(0)

    duration = machine.time_pulse_us(pin, 1, 50000)

    if duration > 0:
        # cm -> inch durch Division mit 2.54
        range_inch = round(duration * 153 / 29 / 2 / 100 / 2.54)
        _distance_backup = round(duration * 153 / 29 / 2 / 100)
    else:
        range_inch = round(_distance_backup / 2.54)

    time.sleep_ms(50)
    return range_inch