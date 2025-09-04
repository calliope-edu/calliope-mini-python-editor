# calliopemini-module: BME680@1.0.0

from calliopemini import *

BME680_ADDR = 0x76

# -----------------------------
# Registerzugriff
# -----------------------------
def read_register(reg, length=1):
    i2c.write(BME680_ADDR, bytes([reg]), repeat=True)
    return i2c.read(BME680_ADDR, length)

def write_register(reg, data):
    i2c.write(BME680_ADDR, bytes([reg]) + bytes([data]))

# -----------------------------
# Kalibrierung laden (BME680 spezifisch)
# -----------------------------
def load_calibration():
    t1 = read_register(0xE9)[0] | (read_register(0xEA)[0] << 8)
    t2 = read_register(0x8A)[0] | (read_register(0x8B)[0] << 8)
    if t2 & 0x8000:
        t2 -= 1 << 16
    t3 = read_register(0x8C)[0]
    if t3 & 0x80:
        t3 -= 1 << 8

    p1 = read_register(0x8E)[0] | (read_register(0x8F)[0] << 8)
    p2 = read_register(0x90)[0] | (read_register(0x91)[0] << 8)
    if p2 & 0x8000:
        p2 -= 1 << 16
    p3 = read_register(0x92)[0]
    if p3 & 0x80:
        p3 -= 1 << 8
    p4 = read_register(0x94)[0] | (read_register(0x95)[0] << 8)
    if p4 & 0x8000:
        p4 -= 1 << 16
    p5 = read_register(0x96)[0] | (read_register(0x97)[0] << 8)
    if p5 & 0x8000:
        p5 -= 1 << 16
    p6 = read_register(0x99)[0]
    if p6 & 0x80:
        p6 -= 1 << 8
    p7 = read_register(0x98)[0]
    if p7 & 0x80:
        p7 -= 1 << 8
    p8 = read_register(0x9C)[0] | (read_register(0x9D)[0] << 8)
    if p8 & 0x8000:
        p8 -= 1 << 16
    p9 = read_register(0x9E)[0] | (read_register(0x9F)[0] << 8)
    if p9 & 0x8000:
        p9 -= 1 << 16
    p10 = read_register(0xA0)[0]

    h1_msb = read_register(0xE2)[0]
    h1_lsb = read_register(0xE3)[0] & 0x0F
    h1 = (h1_msb << 4) | h1_lsb

    h2_msb = read_register(0xE1)[0]
    h2_lsb = (read_register(0xE3)[0] & 0xF0) >> 4
    h2 = (h2_msb << 4) | h2_lsb

    h3 = read_register(0xE4)[0]
    if h3 & 0x80:
        h3 -= 1 << 8

    h4 = read_register(0xE5)[0]
    if h4 & 0x80:
        h4 -= 1 << 8

    h5 = read_register(0xE6)[0]
    if h5 & 0x80:
        h5 -= 1 << 8

    h6 = read_register(0xE7)[0]

    h7 = read_register(0xE8)[0]
    if h7 & 0x80:
        h7 -= 1 << 8

    return {"T1": t1, "T2": t2, "T3": t3,
            "P1": p1, "P2": p2, "P3": p3, "P4": p4, "P5": p5,
            "P6": p6, "P7": p7, "P8": p8, "P9": p9, "P10": p10,
            "H1": h1, "H2": h2, "H3": h3,
            "H4": h4, "H5": h5, "H6": h6, "H7": h7}

# -----------------------------
# Sensor konfigurieren
# -----------------------------
def configure_sensor():
    write_register(0x72, 0x01)
    write_register(0x74, 0b00101001)
    write_register(0x75, 0x00)

# -----------------------------
# Messung starten und warten
# -----------------------------
def trigger_measurement():
    write_register(0x74, 0b00101001)
    sleep(50)
    timeout = 0
    while timeout < 10:
        status = read_register(0x1D)[0]
        if (status & 0x80) == 0:
            break
        sleep(10)
        timeout += 1

# -----------------------------
# Rohdaten auslesen
# -----------------------------
def read_raw_temp():
    d = read_register(0x22, 3)
    return ((d[0] << 12) | (d[1] << 4) | (d[2] >> 4))

def read_raw_pressure():
    d = read_register(0x1F, 3)
    return ((d[0] << 12) | (d[1] << 4) | (d[2] >> 4))

def read_raw_humidity():
    d = read_register(0x25, 2)
    return (d[0] << 8) | d[1]

# -----------------------------
# Temperatur kompensieren
# -----------------------------
def compensate_temp(raw, calib):
    var1 = (raw / 16384.0 - calib["T1"] / 1024.0) * calib["T2"]
    var2 = ((raw / 131072.0 - calib["T1"] / 8192.0) *
            (raw / 131072.0 - calib["T1"] / 8192.0)) * calib["T3"] * 16.0
    t_fine = var1 + var2
    temp = t_fine / 5120.0
    return temp, t_fine

# -----------------------------
# Luftdruck kompensieren
# -----------------------------
def compensate_pressure(raw_p, calib, t_fine):
    var1 = (t_fine / 2.0) - 64000.0
    var2 = var1 * var1 * calib["P6"] / 131072.0
    var2 = var2 + (var1 * calib["P5"] * 2.0)
    var2 = (var2 / 4.0) + (calib["P4"] * 65536.0)
    var1 = ((calib["P3"] * var1 * var1 / 16384.0) + (calib["P2"] * var1)) / 524288.0
    var1 = (1.0 + (var1 / 32768.0)) * calib["P1"]

    if var1 == 0:
        return 0

    press = 1048576.0 - raw_p
    press = ((press - (var2 / 4096.0)) * 6250.0) / var1
    var1 = (calib["P9"] * press * press) / 2147483648.0
    var2 = (press * calib["P8"]) / 32768.0
    press = press + ((var1 + var2 + calib["P7"]) / 16.0)

    return press / 100.0

# -----------------------------
# Luftfeuchtigkeit kompensieren
# -----------------------------
def compensate_humidity(raw_h, calib, t_fine):
    temp_scaled = t_fine / 5120.0

    var1 = raw_h - (calib["H1"] * 16.0 + calib["H3"] / 2.0 * temp_scaled)
    var2 = var1 * (calib["H2"] / 262144.0 * (1.0 + calib["H4"] / 16384.0 * temp_scaled +
                    calib["H5"] / 1048576.0 * temp_scaled * temp_scaled))
    var3 = calib["H6"] / 16384.0
    var4 = calib["H7"] / 2097152.0

    hum = var2 + (var3 + var4 * temp_scaled) * var2 * var2
    hum = max(0.0, min(hum, 100.0))
    return hum

# -----------------------------
# Einzelne Messfunktionen
# -----------------------------
def get_temperature(calib):
    trigger_measurement()
    raw_t = read_raw_temp()
    temp, t_fine = compensate_temp(raw_t, calib)
    return round(temp, 2)

def get_pressure(calib):
    trigger_measurement()
    raw_t = read_raw_temp()
    temp, t_fine = compensate_temp(raw_t, calib)
    raw_p = read_raw_pressure()
    pressure = compensate_pressure(raw_p, calib, t_fine)
    return round(pressure, 2)

def get_humidity(calib):
    trigger_measurement()
    raw_t = read_raw_temp()
    temp, t_fine = compensate_temp(raw_t, calib)
    raw_h = read_raw_humidity()
    hum = compensate_humidity(raw_h, calib, t_fine)
    return round(hum, 2)

# -----------------------------
# Hauptprogramm
# -----------------------------
chip_id = read_register(0xD0)[0]
if chip_id != 0x61:
    raise RuntimeError("Unerwartete Chip ID!")

calib = load_calibration()
configure_sensor()
write_register(0xE0, 0xB6)
sleep(10)
configure_sensor()

while True:
    print("Temperatur:", get_temperature(calib), "°C")
    print("Luftdruck:", get_pressure(calib), "hPa")
    print("Luftfeuchtigkeit:", get_humidity(calib), "%")
    sleep(2000)
