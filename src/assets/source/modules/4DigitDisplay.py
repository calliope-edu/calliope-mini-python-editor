from calliopemini import *

# Define the character map with digits, uppercase and lowercase letters, and special characters
CHAR_MAP = {
    '0': 0x3F,
    '1': 0x06,
    '2': 0x5B,
    '3': 0x4F,
    '4': 0x66,
    '5': 0x6D,
    '6': 0x7D,
    '7': 0x07,
    '8': 0x7F,
    '9': 0x6F,
    'A': 0x77,
    'B': 0x7F,
    'b': 0x7C,
    'C': 0x39,
    'c': 0x58,
    'D': 0x3F,
    'd': 0x5E,
    'E': 0x79,
    'F': 0x71,
    'G': 0x7D,
    'H': 0x76,
    'h': 0x74,
    'I': 0x06,
    'J': 0x1F,
    'K': 0x76,
    'L': 0x38,
    'l': 0x06,
    'n': 0x54,
    'O': 0x3F,
    'o': 0x5C,
    'P': 0x73,
    'r': 0x50,
    'S': 0x6D,
    'U': 0x3E,
    'V': 0x3E,
    'Y': 0x66,
    'Z': 0x5B,
    '-': 0x40,
    '_': 0x08,
    ' ': 0x00,
    ':': 0x80   # Colon character
}

class TM1637:
    def __init__(self, clk, dio):
        self.clk = clk
        self.dio = dio
        self.clk.write_digital(0)
        self.dio.write_digital(0)
        self.brightness = 4  # Default brightness
        self.colon = False  # Default colon state

    def start(self):
        self.dio.write_digital(0)
        self.clk.write_digital(0)

    def stop(self):
        self.clk.write_digital(0)
        self.dio.write_digital(0)
        self.clk.write_digital(1)
        self.dio.write_digital(1)

    def write_byte(self, data):
        for _ in range(8):
            self.clk.write_digital(0)
            self.dio.write_digital(data & 1)
            data >>= 1
            self.clk.write_digital(1)

        self.clk.write_digital(0)
        self.dio.write_digital(1)
        self.clk.write_digital(1)
        while self.dio.read_digital():
            self.dio.write_digital(0)
            self.dio.write_digital(1)

    def show_number(self, number):
        str_number = str(number)
        digits = [' '] * (4 - len(str_number)) + list(str_number)  # Right-align the number
        segment_digits = [CHAR_MAP[digit] for digit in digits]

        self.start()
        self.write_byte(0x40)  # Set auto address mode
        self.stop()

        self.start()
        self.write_byte(0xC0)  # Set starting address
        for segment in segment_digits:
            self.write_byte(segment | (0x80 if self.colon else 0x00))
        self.stop()

        self.start()
        self.write_byte(0x88 | self.brightness)  # Set brightness
        self.stop()

    def show_digit_at(self, digit, position):
        if 1 <= digit <= 9 and 0 <= position <= 3:
            segment_digit = CHAR_MAP[str(digit)]
            self.start()
            self.write_byte(0x44)  # Set fixed address mode
            self.stop()

            self.start()
            self.write_byte(0xC0 | position)  # Set address
            self.write_byte(segment_digit | (0x80 if self.colon and position == 1 else 0x00))
            self.stop()

            self.start()
            self.write_byte(0x88 | self.brightness)  # Set brightness
            self.stop()
        else:
            raise ValueError("Digit must be between 1 and 9, and position must be between 0 and 3")

    def show_letter_at(self, letter, position):
        if letter in CHAR_MAP and 0 <= position <= 3:
            segment_letter = CHAR_MAP[letter]
            self.start()
            self.write_byte(0x44)  # Set fixed address mode
            self.stop()

            self.start()
            self.write_byte(0xC0 | position)  # Set address
            self.write_byte(segment_letter | (0x80 if self.colon and position == 1 else 0x00))
            self.stop()

            self.start()
            self.write_byte(0x88 | self.brightness)  # Set brightness
            self.stop()
        else:
            raise ValueError("Invalid letter or position")

    def clear_display(self):
        self.start()
        self.write_byte(0x40)  # Set auto address mode
        self.stop()

        self.start()
        self.write_byte(0xC0)  # Set starting address
        for _ in range(4):
            self.write_byte(0x00)  # Clear all digits
        self.stop()

        self.start()
        self.write_byte(0x88 | self.brightness)  # Set brightness
        self.stop()

    def set_brightness(self, brightness):
        if 1 <= brightness <= 4:
            self.brightness = brightness
        else:
            raise ValueError("Brightness must be between 1 and 4")

    def set_colon(self, state):
        self.colon = state
        # Update display to reflect the change
        self.show_number(0)  # Show 0 to refresh the display and apply the colon state

# Initialize the display
display = TM1637(pin_A1_RX, pin_A1_TX)

# Beispiel zur Verwendung von show_letter_at

while True:
    display.clear_display()
    display.show_letter_at('C', 0)
    display.show_letter_at('O', 1)
    display.show_letter_at('2', 2)
    display.show_letter_at('-', 3)
    sleep(1000)
    display.clear_display()
    display.show_number(1234)
    sleep(1000)




