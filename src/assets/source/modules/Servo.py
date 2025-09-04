from calliopemini import *

# 180° Servo
def set_servo_angle(pin, angle): #angle 0° - 180°
    angle = max(0, min(180, angle))
    min_val = 26   # 0°
    max_val = 128  # 180°
    value = int(min_val + (max_val - min_val) * angle / 180)
    pin.write_analog(value)

# 360° Servo
def set_servo_speed(pin, speed): #speed -100 - 100 (0 = Stopp)
    speed = max(-100, min(100, speed))
    stop_val = 77      # Stopp-Punkt
    max_offset = 51    # max. Pulsänderung
    value = int(stop_val + (max_offset * speed / 100))
    pin.write_analog(value)

# 180°-Servo an C14 auf 90° setzen
set_servo_angle(pin14, 0)
sleep(1000)

# 360°-Servo an C15 volle Geschwindigkeit vorwärts
set_servo_speed(pin15, 100)
sleep(2000)
set_servo_speed(pin15, 0)  # Stopp
