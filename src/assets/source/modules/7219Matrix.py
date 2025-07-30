# calliopemini-module: 7219Matrix@1.0.0

"""
original version by Radomir Dopieralski
https://bitbucket.org/thesheep/micropython-max7219/
modified according to ideas from jezdean
https://github.com/microbit-playground/matrix7seg
"""

from calliopemini import spi

_NOOP = 0
_DIGIT0 = 1
_DIGIT1 = 2
_DIGIT2 = 3
_DIGIT3 = 4
_DIGIT4 = 5
_DIGIT5 = 6
_DIGIT6 = 7
_DIGIT7 = 8
_DECODEMODE = 9
_INTENSITY = 10
_SCANLIMIT = 11
_SHUTDOWN = 12
_DISPLAYTEST = 15

"""
sample usage
import calliopemini
import matrix7219
display = matrix7219.Matrix8x8(calliopemini.spi, calliopemini.pin0)
display.fill(True)
display.pixel(2, 2, False)
display.show()
"""

class Matrix8x8:
    def __init__(self, spi, cs):
        self.spi = spi
        self.cs = cs
        self.buffer = bytearray(8)
        spi.init()
        self.init()

    def _register(self, command, data):
        # write to display
        self.cs.write_digital(0)
        self.spi.write(bytearray([command, data]))
        self.cs.write_digital(1)

    def init(self):
        for command, data in (
            (_SHUTDOWN, 0),
            (_DISPLAYTEST, 0),
            (_SCANLIMIT, 7),
            (_DECODEMODE, 0),
            (_SHUTDOWN, 1),
        ):
            self._register(command, data)

    def brightness(self, value):
        if not 0<= value <= 15:
            raise ValueError("Brightness out of range")
        self._register(_INTENSITY, value)

    def fill(self, color):
        data = 0xff if color else 0x00
        for y in range(8):
            self.buffer[y] = data

    def pixel(self, x, y, color=None):
        if color is None:
            return bool(self.buffer[y] & 1 << x)
        elif color:
            self.buffer[y] |= 1 << x
        else:
            self.buffer[y] &= ~(1 << x)

    def show(self):
        for y in range(8):
            self._register(_DIGIT0 + y, self.buffer[y])
