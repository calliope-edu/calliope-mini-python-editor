# calliopemini-module: SCD40@1.0.0

from calliopemini import *
import time

SCD40_I2C_ADDR = 0x62

# Variablen für die Messwerte
co2 = 0
temperature = 0
relative_humidity = 0
last_measure_time = 0  # Zeitpunkt der letzten Messung in Millisekunden

def write_command(addr, command, repeat=False):
    try:
        i2c.write(addr, bytes(command), repeat)
    except Exception as e:
        print("Error writing command: " + str(e))

def read_data(addr, length):
    try:
        data = i2c.read(addr, length)
        return data
    except Exception as e:
        print("Error reading data: " + str(e))
        return bytearray()

def read_word(addr):
    data = read_data(addr, 2)  # Auslesen von 2 Bytes
    if len(data) == 2:
        word = int.from_bytes(data, 'big')
        return word
    else:
        return 0

def read_words(addr, number_of_words):
    data = read_data(addr, number_of_words * 3)  # Auslesen der entsprechenden Anzahl an Bytes (3 Bytes pro Wort)
    words = []
    for i in range(number_of_words):
        if len(data) >= (3 * i + 2):  # Überprüfung, ob genügend Daten vorhanden sind
            word = int.from_bytes(data[3 * i:3 * i + 2], 'big')
            words.append(word)
    return words

def get_data_ready_status():
    write_command(SCD40_I2C_ADDR, [0xE4, 0xB8])  # Überprüfung, ob Daten breitstehen
    time.sleep(0.001)
    data_ready = read_word(SCD40_I2C_ADDR) & 0x07FF
    return data_ready > 0

def read_measurement():
    global co2, temperature, relative_humidity, last_measure_time
    current_time = running_time()
    
    # Messinterval von 5 Sekunden
    if current_time - last_measure_time < 5000:
        return  # Gib die vorherigen Werte zurück

    last_measure_time = current_time  # Aktualisiere den Zeitpunkt der letzten Messung

    if not get_data_ready_status():
        return
    
    write_command(SCD40_I2C_ADDR, [0xEC, 0x05])  # Auslesen der Messwerte
    time.sleep(0.001)
    
    values = read_words(SCD40_I2C_ADDR, 6)
    if len(values) < 3:
        return
    
    co2 = values[0]
    adc_t = values[1]
    adc_rh = values[2]
    
    temperature = -45 + (175 * adc_t / (1 << 16))
    temperature = round(temperature, 1)
    
    relative_humidity = 100 * adc_rh / (1 << 16)
    relative_humidity = round(relative_humidity, 1)

def perform_factory_reset():
    write_command(SCD40_I2C_ADDR, [0x36, 0x32])  # Zurücksetzen auf Werkseinstellungen

def start_continuous_measurement():
    write_command(SCD40_I2C_ADDR, [0x21, 0xB1])  # Starten einer kontinuierlichen Messung

def stop_continuous_measurement():
    write_command(SCD40_I2C_ADDR, [0x3F, 0x86])  # Stoppen der kontinuierlichen Messung
    time.sleep(0.5)

# Funktionen zur Abfrage der Messwerte
def get_co2():
    read_measurement()  # Messwerte auslesen
    return co2

def get_temperature():
    read_measurement()  # Messwerte auslesen
    return temperature

def get_relative_humidity():
    read_measurement()  # Messwerte auslesen
    return relative_humidity
