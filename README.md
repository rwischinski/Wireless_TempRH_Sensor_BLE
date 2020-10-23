# Wireless ESP32-based Temperature/RH sensor with Web Bluetooth interface

Overview:

This was created to wirelessly monitor temperature and relative humidity in an environmental chamber. The ESP32 periodically sends data to a device's (BLE capable smart phone, tablet or PC) web browser, using web bluetooth. Web pages are hosted on Github (link below).
Alternatively pages and supporting files can be hosted on a web server of your choice (https is required though).
The web interface allows to pair the ESP32. Temperature units (Degree Celsius or Fahrenheit) as well as sample interval can be selected. Temperature and Relative Humidity values are displayed and presented as a line graph.

Hardware:
* Sparkfun ESP32 Thing Plus (https://www.sparkfun.com/products/15663)
* Adafruit Si7021 Temperature/Relative Humidity Sensor (https://www.adafruit.com/product/3251%0A)
* LiPo battery (optional; well, without it it is not really wireless)

Webpage:
* Uses: jQuery, Bootstrap, Popper, Dygraphs (trend chart; https://dygraphs.com/)

![IntegraTRH BLE Sensor](https://user-images.githubusercontent.com/6797506/96926352-7750fe00-1483-11eb-8272-d3238da30e06.png)

Install and run:
* Load sketch (Wireless_TempRH_Sensor_BLE.ino) to ESP32
* Open web browser using URL: https://rwischinski.github.io/Wireless_TempRH_Sensor_BLE/http/
* Click on "Connect"
* Select "Integra_TRH_Sensor_01" (increment index for additional sensors)
* Click on "Pair"
* Enjoy
