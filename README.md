# Webserial API for controllers

lcd/oled/tft display controller's low-level commands via Web Serial API.

Useful for explore/troubleshoot brightness-related and geometry-related parameters (Bias, Regulation Resistor Ratio, Electronic Volume, Booster, line/column shift etc).

Usage:
- Wire burned MCU and display via i2c/spi.
- Open webserialforcontrollers.ino and change connection settings (i2c/spi).
- Burn webserialforcontrollers.ino to avr/stm32/esp/etc mcu.
- Wire burned MCU to your computer with com-port.
- Open index.html in Chrome/Edge/Opera (don't forget to activate Web Serial API - see disclaimer in index.html).
- Connect to apropriate com port.
- Use clickable bit fiedls to adjust/add/change Command byte(s) and send it to MCU.
- New command can be added by modifying index.html ('Toggle command set editing' button).
