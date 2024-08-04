#
# ST7567 led display controller commands via Web Serial API
# more info: https://github.com/trng/st7567webserial
#

#include <Arduino.h>
#include <U8g2lib.h>

#ifdef U8X8_HAVE_HW_SPI
#include <SPI.h>
#endif
#ifdef U8X8_HAVE_HW_I2C
#include <Wire.h>
#endif

const int csPin = 10;
const int dcPin = 9;
const int resetPin = 8;

U8G2_ST7567_PI_132X64_F_4W_HW_SPI u8g2(U8G2_R0, /* cs=*/ csPin, /* dc=*/ dcPin, /* reset=*/ resetPin);  // Pax Instruments Shield, LCD_BL=6

void setup(void) {
  Serial.begin(9600);

  u8g2.begin();
  u8g2.clearBuffer();					// clear the internal memory
  u8g2.setContrast(11);
  u8g2.setFont(u8g2_font_ncenB08_tr);	// choose a suitable font
  u8g2.drawStr(0,10,"Hello World!");	// write something to the internal memory
  u8g2.sendBuffer();					// transfer internal memory to the display
 

  //sendCommand(0x0E2); // Software Reset
  //sendCommand(0b10100011); // Bias 1/9 (try 0xA3 for 1/7)
  //sendCommand(0b00101111); // Power Control: Booster, Regulator, and Follower ON (3 lower bits)
  //sendCommand(0b11111000); // Set Booster
  //sendCommand(0b00000000); // Set Booster to level 0
  //sendCommand(0b10000001); // Set EV
  //sendCommand(0b00000000); // Set EV to mid-range (adjust as needed)
  //sendCommand(0b00100000); // Regulation Ratio (adjust as needed)
  //sendCommand(0x0AF); // Display ON

}


void loop(void) {

}


void helloWorld() {
  u8g2.clearBuffer();					// clear the internal memory
  // u8g2.setFont(u8g2_font_ncenB08_tr);	// choose a suitable font
  char cbuf[12];
  sprintf( cbuf, "%lu", millis() );
  u8g2.drawStr( 0, 10, cbuf );	// write something to the internal memory
  
  //u8g2.drawStr(0,25,"Hello World!!!");	// write something to the internal memory
  u8g2.sendBuffer();					// transfer internal memory to the display
}


void sendCommand(uint8_t command) {
  SPI.beginTransaction(SPISettings(8000000, MSBFIRST, SPI_MODE0));
  digitalWrite(dcPin, LOW); // Set DC to command mode
  digitalWrite(csPin, LOW); // Select the display
  SPI.transfer(command); // Send the command
  digitalWrite(csPin, HIGH); // Deselect the display
  SPI.endTransaction();
}


void send2bytesCommand(uint8_t command_byte, uint8_t data_byte) {
  SPI.beginTransaction(SPISettings(8000000, MSBFIRST, SPI_MODE0));

  digitalWrite(dcPin, LOW); // Set DC to command mode
  digitalWrite(csPin, LOW); // Select the display

  SPI.transfer(command_byte); // Send the command
  SPI.transfer(data_byte); // Send the data

  digitalWrite(csPin, HIGH); // Deselect the display
  SPI.endTransaction();
}


uint8_t parseBinaryString(const String& binStr) {
    uint8_t result = 0;
    for (int i = 2; i < binStr.length(); i++) { // Skip the first two characters "0b"
        result <<= 1; // Shift the result left by 1 bit
        if (binStr[i] == '1') {
            result |= 1; // Set the least significant bit if the current character is '1'
        }
    }
    return result;
}

void serialEvent() {

  String userInputStr = Serial.readStringUntil('\n');
  if (userInputStr.charAt(1) != 'b') {
    int i = userInputStr.toInt();
    u8g2.setContrast(i);
    //Serial.print("New contrast: "); 
    Serial.println(i);
    return;
  }

  int comma_index = userInputStr.indexOf(',');
  if (comma_index != -1) {
    String cmd_part = userInputStr.substring(0, comma_index);
    String dat_part = userInputStr.substring(comma_index+1);
    if ( (cmd_part.length() != 10) || (dat_part.length() != 10) ) {
      //Serial.println("String has wrong format (must be 10: 0b01010101,0b10101010");
      return;
    }
    Serial.print(cmd_part); Serial.print(","); Serial.println(dat_part);
    send2bytesCommand( parseBinaryString(cmd_part), parseBinaryString(dat_part) );
  } else {
    if ( userInputStr.length() != 10 ) {
      //Serial.println("String has wrong format (must be 0b01010101");
      return;
    }
    Serial.println(userInputStr);
    sendCommand( parseBinaryString(userInputStr) );
  }

  helloWorld();
}
