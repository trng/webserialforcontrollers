# st7567webserial

ST7567 led display controller commands via Web Serial API.

Useful for explore brightness-related parameters (Bias, Regulation Resistor Ratio, Electronic Volume, Booster).

Usage:
- Open ST7567-web-serial.ino and burn to avr/stm32/etc controller with com-port connected to your computer.
- Wire burned MCU and ST7567 display.
- Open index.html in Chrome/Edge/Opera (don't forget to activate Web Serial API - see disclaimer in index.html).
- Connect to apropriate com port.
- Use clickable bit fiedls to adjust Command byte(s) and send it to MCU.
- Any other command can be added by modifying index.html (look for 'table' tag and copy-paste more 'tr' tag(s)).
