import struct,utime
from calliopemini import pin8,pin13,pin14,pin15,pin_A1_TX,spi

_M=0x7ACD
_MN=0xB3CD  # NOOP frame – normal when STM32 has no data
_GR=0x1000
_SR=0x2000
_PR=0x80
_BR=0x01
_SU=0x81
_SP=0x83
_RD=0x101
_FL=12
_FS=252

BUTTON_LEFT=0x02
BUTTON_UP=0x04
BUTTON_RIGHT=0x08
BUTTON_DOWN=0x10
BUTTON_A=0x20
BUTTON_B=0x40
BUTTON_MENU=0x80
W=160
H=120

class Button:
 def __init__(self,sh,m):self._sh=sh;self._m=m
 def is_pressed(self):return bool(self._sh._bs&self._m)
 def just_pressed(self):return bool(self._sh._bs&self._m) and not bool(self._sh._pb&self._m)
 def just_released(self):return not bool(self._sh._bs&self._m) and bool(self._sh._pb&self._m)

class SmartShield:
 def __init__(self,device_id=0x123456789ABCDEF0):
  self._id=device_id
  self._tx=bytearray(_FS)
  self._rx=bytearray(_FS)
  self._fb=bytearray(W*(H//2))
  self._bs=0
  self._pb=0
  self._ok=False
  self._sz=0
  # Pre-built NOOP frame (used only for begin() announce)
  self._noop=bytearray(_FS)
  self._noop[0]=_MN&0xFF;self._noop[1]=(_MN>>8)&0xFF
  # Pre-built START_UPDATE frame for pump() – STM32 only includes button data
  # in responses to display service commands; an empty frame gets sz=0 back.
  self._pf=bytearray(_FS)
  self._pf[0]=_M&0xFF;self._pf[1]=(_M>>8)&0xFF
  struct.pack_into('<Q',self._pf,4,device_id)
  # packet: ss=8, sn=1 (display), sc=START_UPDATE(0x81), payload=x0,y0,W,H
  self._pf[_FL+0]=8;self._pf[_FL+1]=1
  struct.pack_into('<H',self._pf,_FL+2,_SU)
  struct.pack_into('<HHHH',self._pf,_FL+4,0,0,W,H)
  self._pf[2]=(8+4+3)&~3  # frame sz = 12
  # Dirty column range: only columns [_dx0, _dx1) are transmitted in show()
  self._dx0=0;self._dx1=W
  self.button_a    =Button(self,BUTTON_A)
  self.button_b    =Button(self,BUTTON_B)
  self.button_up   =Button(self,BUTTON_UP)
  self.button_down =Button(self,BUTTON_DOWN)
  self.button_left =Button(self,BUTTON_LEFT)
  self.button_right=Button(self,BUTTON_RIGHT)
  self.button_menu =Button(self,BUTTON_MENU)
 def begin(self):
  print('--- begin() ---')
  print('  pin8 before pull_down:',pin8.read_digital())
  pin8.set_pull(pin8.PULL_DOWN)
  print('  pin8 after  pull_down:',pin8.read_digital())
  spi.init(baudrate=16000000,bits=8,mode=0,sclk=pin13,mosi=pin15,miso=pin14)
  print('  spi init done, pin8=',pin8.read_digital())
  if pin8.read_digital()==0:
   print('  pin8 LOW -> sending reset pulse to STM32')
   pin_A1_TX.write_digital(0)
   utime.sleep_ms(20)
   pin_A1_TX.write_digital(1)
   print('  reset pulse done, waiting for STM32 boot...')
  else:
   print('  pin8 HIGH -> STM32 already running, skipping reset')
  # Poll until STM32 asserts pin8 (its first announce frame)
  for i in range(10000):
   if pin8.read_digital()==1:
    # JACDAC-SPI: we MUST respond with an SPI exchange when pin8 rises.
    # Send a NOOP frame to complete the announce transaction.
    for j in range(_FS):self._tx[j]=0
    struct.pack_into('<H',self._tx,0,_MN)  # NOOP magic = 0xB3CD
    spi.write_readinto(self._tx,self._rx)
    rxm=self._rx[0]|(self._rx[1]<<8)
    print('  announce exchange done: rx_magic=',hex(rxm),'after',i,'ms')
    # Wait for pin8 to drop (STM32 finished announce exchange)
    for _ in range(1000):
     if pin8.read_digital()==0:break
     utime.sleep_ms(1)
    self._ok=True
    print('--- begin() OK ---')
    return
   if i>0 and i%500==0:
    print('  still waiting... pin8=',pin8.read_digital(),'(',i,'ms)')
   utime.sleep_ms(1)
  print('  ERROR: begin() TIMEOUT (10s) – STM32 never asserted pin8')
  print('--- begin() FAILED ---')
 def update(self):
  v=pin8.read_digital()
  if v==1 and not self._ok:
   print('  shield connected via update() (pin8 went HIGH)')
   self._ok=True
 def pump(self,wait_us=5000):
  # Wait up to wait_us microseconds for pin8 HIGH, do one proper frame exchange.
  # Must use a proper (0x7ACD) frame – STM32 only sends button data for real frames,
  # not NOOP (0xB3CD) exchanges.
  if not self._ok:return False
  end=utime.ticks_add(utime.ticks_us(),wait_us)
  while utime.ticks_diff(end,utime.ticks_us())>0:
   if pin8.read_digital()==1:
    spi.write_readinto(self._pf,self._rx)
    self._pr()
    return True
  return False
 def is_connected(self):
  return self._ok
 def _rf(self):
  for i in range(_FS):self._tx[i]=0
  struct.pack_into('<Q',self._tx,4,self._id)
  self._sz=0
 def _pp(self,sn,sc,ps):
  o=_FL+self._sz
  self._tx[o]=ps
  self._tx[o+1]=sn
  struct.pack_into('<H',self._tx,o+2,sc)
  self._sz+=(ps+4+3)&~3
  return o+4
 def _wait_ready(self,label=''):
  # Wait for STM32 to assert pin8 HIGH (ready to receive) before SPI transfer
  for i in range(10000):
   if pin8.read_digital()==1:return True
   utime.sleep_ms(1)
  print('  _wait_ready TIMEOUT',label)
  return False
 def _tx_(self):
  struct.pack_into('<H',self._tx,0,_M)
  self._tx[2]=self._sz
  spi.write_readinto(self._tx,self._rx)
 def _pr(self,dbg=False):
  rx=self._rx
  rxm=rx[0]|(rx[1]<<8)
  if rxm!=_M:
   if rxm!=0 and rxm!=_MN:
    print('  _pr: unexpected rx_magic=',hex(rxm))
   return
  sz=rx[2]
  if sz==0:
   if dbg:print('  _pr: valid frame sz=0')
   return
  # iterate all service packets; control announce (sn=0) is always first
  # but button data (sn=2) may follow in the same frame
  o=_FL
  while o<_FL+sz:
   ss=rx[o];sn=rx[o+1];sc=rx[o+2]|(rx[o+3]<<8)
   if sn==2 and sc==(_GR|_RD):
    old=self._bs;self._bs=0
    for i in range(ss>>1):
     idx=rx[o+4+i*2];p=rx[o+5+i*2]
     if p>0 and 1<=idx<=7:self._bs|=(1<<idx)
    if self._bs!=old:
     print('  buttons: 0x{:02X} -> 0x{:02X}'.format(old,self._bs))
   elif sn!=0:
    print('  _pr: sn={} sc=0x{:04X} ss={}'.format(sn,sc,ss))
   o+=(ss+4+3)&~3
 def set_palette(self,pal):
  print('  set_palette: waiting for pin8...')
  self._wait_ready('set_palette')
  print('  set_palette: sending 16 colours')
  self._rf()
  o=self._pp(1,_SR|_PR,64)
  for i in range(16):
   c=pal[i] if i<len(pal) else 0
   self._tx[o+i*4]=c&0xFF
   self._tx[o+i*4+1]=(c>>8)&0xFF
   self._tx[o+i*4+2]=(c>>16)&0xFF
  self._tx_()
  rxm=hex(self._rx[0]|(self._rx[1]<<8))
  print('  set_palette done, rx_magic=',rxm,'(OK)' if self._rx[0]==0xCD and self._rx[1]==0x7A else '(no ack)')
 def set_brightness(self,b):
  print('  set_brightness:',b)
  self._wait_ready('set_brightness')
  self._rf();o=self._pp(1,_SR|_BR,1);self._tx[o]=b&0xFF;self._tx_()
  rxm=hex(self._rx[0]|(self._rx[1]<<8))
  print('  set_brightness done, rx_magic=',rxm,'(OK)' if self._rx[0]==0xCD and self._rx[1]==0x7A else '(no ack)')
 def clear(self,c=0):
  p=((c&0xF)<<4)|(c&0xF)
  for i in range(len(self._fb)):self._fb[i]=p
  self._dx0=0;self._dx1=W  # whole screen dirty
 def set_pixel(self,x,y,c):
  if x<0 or x>=W or y<0 or y>=H:return
  i=x*60+(y>>1)
  if y&1:self._fb[i]=(self._fb[i]&0x0F)|((c&0xF)<<4)
  else:self._fb[i]=(self._fb[i]&0xF0)|(c&0xF)
  if x<self._dx0:self._dx0=x
  if x>=self._dx1:self._dx1=x+1
 def get_pixel(self,x,y):
  if x<0 or x>=W or y<0 or y>=H:return 0
  i=x*60+(y>>1);return(self._fb[i]>>4)if(y&1)else(self._fb[i]&0x0F)
 def fill_rect(self,x,y,w,h,c):
  fb=self._fb;c=c&0xF;packed=(c<<4)|c
  x0=max(x,0);x1=min(x+w,W)
  y0=max(y,0);y1=min(y+h,H)
  if x0<self._dx0:self._dx0=x0  # mark dirty
  if x1>self._dx1:self._dx1=x1
  for px in range(x0,x1):
   base=px*60
   # odd start row: write low nibble only
   py=y0
   if py&1:  # odd start: set high nibble of first byte, then proceed on even boundary
    i=base+(py>>1)
    fb[i]=(fb[i]&0x0F)|(c<<4)
    py+=1
   end_partial=(y1&1) and y1>py  # y1 is odd: last row (y1-1) is even → low nibble only
   ey=y1-1 if end_partial else y1
   # write full bytes for even-aligned span
   for row in range(py>>1,ey>>1):
    fb[base+row]=packed
   if end_partial:
    i=base+(ey>>1)
    fb[i]=(fb[i]&0xF0)|c
 def draw_rect(self,x,y,w,h,c):
  for px in range(x,x+w):self.set_pixel(px,y,c);self.set_pixel(px,y+h-1,c)
  for py in range(y,y+h):self.set_pixel(x,py,c);self.set_pixel(x+w-1,py,c)
 def draw_line(self,x0,y0,x1,y1,c):
  dx=abs(x1-x0);dy=-abs(y1-y0)
  sx=1 if x0<x1 else -1;sy=1 if y0<y1 else -1;e=dx+dy
  while True:
   self.set_pixel(x0,y0,c)
   if x0==x1 and y0==y1:break
   e2=2*e
   if e2>=dy:e+=dy;x0+=sx
   if e2<=dx:e+=dx;y0+=sy
 def _bake(self,x0,w):
  # Pre-bake fixed tx bytes for pixel batches starting at column x0 with width w.
  tx=self._tx;sp0=_SP&0xFF;sp1=(_SP>>8)&0xFF
  tx[0]=_M&0xFF;tx[1]=(_M>>8)&0xFF;tx[3]=0
  struct.pack_into('<Q',tx,4,self._id)
  tx[12]=60;tx[13]=1;tx[14]=sp0;tx[15]=sp1
  tx[76]=60;tx[77]=1;tx[78]=sp0;tx[79]=sp1
  tx[140]=60;tx[141]=1;tx[142]=sp0;tx[143]=sp1
 def show(self,verbose=False):
  self._pb=self._bs  # snapshot for just_pressed()/just_released()
  if self._dx0>=self._dx1:
   self.pump()  # nothing to draw – still poll for button data via START_UPDATE
   return
  x0=self._dx0;x1=self._dx1
  t=utime.ticks_ms()
  # START_UPDATE always spans full screen – partial regions confuse the STM32.
  # We still only transmit SET_PIXELS for dirty columns; the rest keep their GRAM data.
  self._wait_ready('START_UPDATE')
  self._rf()
  o=self._pp(1,_SU,8)
  struct.pack_into('<HHHH',self._tx,o,0,0,W,H)
  self._tx_();self._pr()
  self._bake(x0,x1-x0)
  tx=self._tx;rx=self._rx;fb=self._fb
  rd=pin8.read_digital
  timeouts=0;bad_rx=0;batches=0
  for sc in range(x0,x1,3):
   w=0
   while rd()==0:
    w+=1
    if w>100000:print('  show: pin8 TIMEOUT col',sc);timeouts+=1;break
   cols=min(3,x1-sc)
   tx[2]=cols<<6
   fs=sc*60
   for i in range(60):tx[16+i]=fb[fs+i]
   if cols>1:
    fs+=60
    for i in range(60):tx[80+i]=fb[fs+i]
   if cols>2:
    fs+=60
    for i in range(60):tx[144+i]=fb[fs+i]
   spi.write_readinto(tx,rx)
   self._pr()
   m=rx[0]|(rx[1]<<8)
   if m!=_M and m!=_MN and m!=0:bad_rx+=1  # NOOP=normal, 0=no-data; only flag truly unexpected
   batches+=1
  # Reset dirty range – nothing dirty; pump() in the early-return path keeps button data flowing.
  self._dx0=0;self._dx1=0
  e=utime.ticks_diff(utime.ticks_ms(),t)
  if verbose or timeouts or bad_rx:
   print('  show: {}ms ({:.1f}fps) cols={}/{} batches={} timeouts={} bad_rx={}'.format(
    e,1000/e if e else 0,x1-x0,W,batches,timeouts,bad_rx))
 def test_pattern(self):
  self.clear(0)
  for y in range(H):self.set_pixel(10,y,1)
  for x in range(W):self.set_pixel(x,10,2)
  for i in range(H):self.set_pixel(i,i,3)
 def draw_char(self,x,y,ch,col,bg=-1):
  c=ord(ch) if isinstance(ch,str) else ch
  if c<32 or c>126:c=63  # '?' for out-of-range
  o=(c-32)*5
  for cx in range(5):
   col_bits=_F5X7[o+cx]
   for cy in range(7):
    if col_bits&(1<<cy):self.set_pixel(x+cx,y+cy,col)
    elif bg>=0:self.set_pixel(x+cx,y+cy,bg)
  if bg>=0:
   for cy in range(7):self.set_pixel(x+5,y+cy,bg)  # 1-px gap column
 def draw_text(self,x,y,s,col,bg=-1):
  for ch in s:
   if x+5>W:break
   self.draw_char(x,y,ch,col,bg)
   x+=6
 def buttons(self):return self._bs

# 5x7 font: 5 column-bytes per char, bit0=top, ASCII 32-126
_F5X7=bytes([
0x00,0x00,0x00,0x00,0x00, # space
0x00,0x00,0x5F,0x00,0x00, # !
0x00,0x07,0x00,0x07,0x00, # "
0x14,0x7F,0x14,0x7F,0x14, # #
0x24,0x2A,0x7F,0x2A,0x12, # $
0x23,0x13,0x08,0x64,0x62, # %
0x36,0x49,0x55,0x22,0x50, # &
0x00,0x05,0x03,0x00,0x00, # '
0x00,0x1C,0x22,0x41,0x00, # (
0x00,0x41,0x22,0x1C,0x00, # )
0x08,0x2A,0x1C,0x2A,0x08, # *
0x08,0x08,0x3E,0x08,0x08, # +
0x00,0x50,0x30,0x00,0x00, # ,
0x08,0x08,0x08,0x08,0x08, # -
0x00,0x60,0x60,0x00,0x00, # .
0x20,0x10,0x08,0x04,0x02, # /
0x3E,0x51,0x49,0x45,0x3E, # 0
0x00,0x42,0x7F,0x40,0x00, # 1
0x42,0x61,0x51,0x49,0x46, # 2
0x21,0x41,0x45,0x4B,0x31, # 3
0x18,0x14,0x12,0x7F,0x10, # 4
0x27,0x45,0x45,0x45,0x39, # 5
0x3C,0x4A,0x49,0x49,0x30, # 6
0x01,0x71,0x09,0x05,0x03, # 7
0x36,0x49,0x49,0x49,0x36, # 8
0x06,0x49,0x49,0x29,0x1E, # 9
0x00,0x36,0x36,0x00,0x00, # :
0x00,0x56,0x36,0x00,0x00, # ;
0x00,0x08,0x14,0x22,0x41, # <
0x14,0x14,0x14,0x14,0x14, # =
0x41,0x22,0x14,0x08,0x00, # >
0x02,0x01,0x51,0x09,0x06, # ?
0x32,0x49,0x79,0x41,0x3E, # @
0x7E,0x11,0x11,0x11,0x7E, # A
0x7F,0x49,0x49,0x49,0x36, # B
0x3E,0x41,0x41,0x41,0x22, # C
0x7F,0x41,0x41,0x22,0x1C, # D
0x7F,0x49,0x49,0x49,0x41, # E
0x7F,0x09,0x09,0x09,0x01, # F
0x3E,0x41,0x49,0x49,0x7A, # G
0x7F,0x08,0x08,0x08,0x7F, # H
0x00,0x41,0x7F,0x41,0x00, # I
0x20,0x40,0x41,0x3F,0x01, # J
0x7F,0x08,0x14,0x22,0x41, # K
0x7F,0x40,0x40,0x40,0x40, # L
0x7F,0x02,0x04,0x02,0x7F, # M
0x7F,0x04,0x08,0x10,0x7F, # N
0x3E,0x41,0x41,0x41,0x3E, # O
0x7F,0x09,0x09,0x09,0x06, # P
0x3E,0x41,0x51,0x21,0x5E, # Q
0x7F,0x09,0x19,0x29,0x46, # R
0x46,0x49,0x49,0x49,0x31, # S
0x01,0x01,0x7F,0x01,0x01, # T
0x3F,0x40,0x40,0x40,0x3F, # U
0x1F,0x20,0x40,0x20,0x1F, # V
0x3F,0x40,0x38,0x40,0x3F, # W
0x63,0x14,0x08,0x14,0x63, # X
0x03,0x04,0x78,0x04,0x03, # Y
0x61,0x51,0x49,0x45,0x43, # Z
0x00,0x7F,0x41,0x41,0x00, # [
0x02,0x04,0x08,0x10,0x20, # backslash
0x00,0x41,0x41,0x7F,0x00, # ]
0x04,0x02,0x01,0x02,0x04, # ^
0x40,0x40,0x40,0x40,0x40, # _
0x00,0x01,0x02,0x04,0x00, # `
0x20,0x54,0x54,0x54,0x78, # a
0x7F,0x48,0x44,0x44,0x38, # b
0x38,0x44,0x44,0x44,0x20, # c
0x38,0x44,0x44,0x48,0x7F, # d
0x38,0x54,0x54,0x54,0x18, # e
0x08,0x7E,0x09,0x01,0x02, # f
0x08,0x54,0x54,0x54,0x3C, # g
0x7F,0x08,0x04,0x04,0x78, # h
0x00,0x44,0x7D,0x40,0x00, # i
0x20,0x40,0x44,0x3D,0x00, # j
0x7F,0x10,0x28,0x44,0x00, # k
0x00,0x41,0x7F,0x40,0x00, # l
0x7C,0x04,0x18,0x04,0x78, # m
0x7C,0x08,0x04,0x04,0x78, # n
0x38,0x44,0x44,0x44,0x38, # o
0x7C,0x14,0x14,0x14,0x08, # p
0x08,0x14,0x14,0x18,0x7C, # q
0x7C,0x08,0x04,0x04,0x08, # r
0x48,0x54,0x54,0x54,0x20, # s
0x04,0x3F,0x44,0x40,0x20, # t
0x3C,0x40,0x40,0x20,0x7C, # u
0x1C,0x20,0x40,0x20,0x1C, # v
0x3C,0x40,0x30,0x40,0x3C, # w
0x44,0x28,0x10,0x28,0x44, # x
0x0C,0x50,0x50,0x50,0x3C, # y
0x44,0x64,0x54,0x4C,0x44, # z
0x00,0x08,0x36,0x41,0x00, # {
0x00,0x00,0x7F,0x00,0x00, # |
0x00,0x41,0x36,0x08,0x00, # }
0x08,0x04,0x08,0x10,0x08, # ~
])
PALETTE_16=[
 0x000000,0xFFFFFF,0xFF0000,0x00FF00,
 0x0000FF,0xFFFF00,0xFF00FF,0x00FFFF,
 0x808080,0xFF8000,0x8000FF,0x00FF80,
 0x0080FF,0xFF0080,0x80FF00,0x404040,
]
