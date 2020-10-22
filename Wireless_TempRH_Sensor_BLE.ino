
/*
 * Sketch: BLE
 * Intended to be run on an ESP32
 */


// ====================================== BLE ============================================== //

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
// Temp/RH sensor library
#include "Adafruit_Si7021.h"
Adafruit_Si7021 sensor = Adafruit_Si7021();

BLEServer* pServer = NULL;
BLECharacteristic* pCharacteristic = NULL;
BLECharacteristic* pCharacteristic1 = NULL;
bool deviceConnected = false;
bool oldDeviceConnected = false;

byte pin_led = 13;
boolean LEDstatus = LOW;

float tempC = 0.0;
float rh = 0.0;

unsigned long t_old = 0L;

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"	// write value to browser
#define CHARACTERISTIC_UUID1 "beb5483e-36e1-4688-b7f5-ea07361b26a9"	// read value from browser


class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
    }
};

class NewDataReceivedCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic1) {
      std::string value = pCharacteristic1->getValue();

      String txt ="";

      if (value.length() > 0) {
        Serial.print("New value: ");
        for (int i = 0; i < value.length(); i++)
          txt = txt + value[i];
        Serial.println(txt);
        if (txt == "LED1") {
          LEDstatus = HIGH;
        }
        else if (txt == "LED0") {
          LEDstatus = LOW;
        }
        digitalWrite(pin_led,LEDstatus);
      }
    }
};
// ====================================== BLE ============================================== //

 
void setup()
{

Serial.begin(115200);

   if (!sensor.begin()) {
    Serial.println("Did not find Si7021 sensor!");
    while (true)
      ;
  }

pinMode(pin_led, OUTPUT);
digitalWrite(pin_led,LEDstatus);

// ====================================== BLE ============================================== //
  // Create the BLE Device
  BLEDevice::init("Integra_TRH_Sensor_01");

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create a BLE Characteristic to send data to web browser
  pCharacteristic = pService->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY |
                      BLECharacteristic::PROPERTY_INDICATE
                    );

  // Create a BLE Characteristic to receive data from web browser
  pCharacteristic1 = pService->createCharacteristic(
                      CHARACTERISTIC_UUID1,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE
                    );

  // Create a BLE Descriptor
  pCharacteristic->addDescriptor(new BLE2902());
  pCharacteristic1->addDescriptor(new BLE2902());
  pCharacteristic1->setCallbacks(new NewDataReceivedCallbacks());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);  // set value to 0x00 to not advertise this parameter
  BLEDevice::startAdvertising();
  Serial.println("Waiting a client connection to notify...");
  // ====================================== BLE ============================================== //
}
 
void loop()
{

  // ====================================== BLE ============================================== //
  
  if (millis() > t_old + 100) {
      t_old = millis();
    tempC = sensor.readTemperature();
      // notify changed value
      if (deviceConnected) {
          char txString[16];
          tempC = sensor.readTemperature();
          String displayText = "temp:";
          displayText += String(tempC);
          displayText.toCharArray(txString, 19);
          pCharacteristic->setValue(txString);
          pCharacteristic->notify();
      delay(10);
          rh = sensor.readHumidity();
          displayText = "rh:";
          displayText += String(rh);
          displayText.toCharArray(txString, 19);
          pCharacteristic->setValue(txString);
          pCharacteristic->notify();
      }
  }
    
    // disconnecting
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // give the bluetooth stack the chance to get things ready
        pServer->startAdvertising(); // restart advertising
        Serial.println("start advertising");
        oldDeviceConnected = deviceConnected;
    }
    // connecting
    if (deviceConnected && !oldDeviceConnected) {
        // do stuff here on connecting
        oldDeviceConnected = deviceConnected;
    }
  // ====================================== BLE ============================================== //
  
 
}
