# React Native Application

## Overview

This React Native application connects to a Raspberry Pi GATT server to monitor and manage various data points from a beehive. The application allows users to input a password, verify it with the server, and then access real-time data from the beehive, from sensor readings. The application is written in TypeScript and uses various libraries for charts and BLE communication.

## Features

- **BLE Hive Connection:** Connects to a Raspberry Pi GATT server.
- **BLE Hive Communication:** Communicates with Pi GATT server via characteristics.
- **Password Verification:** Securely sends and verifies a password with the pi.
- **Real-Time Data Monitoring:** Displays sensor data.
- **Chart Visualization:** Line graph representation of data, including handling of gaps (NaN values).
- **Pi Modifications:** Allows commands and modification of config file variables

## Installation

### Prerequisites

- Node.js
- npm
- React Native CLI

### Steps to get code on your machine
1. **Clone the repository:**
   ```bash
   git clone https://github.com/tcollins6049/bluetooth_hive_connect.git
   cd bluetooth_hive_connect
2. **Install dependencies and run:**
   ```bash
   npm install
   npm start
3. **To assemble build for release (Android):**
   ```
   cd android
   ./gradlew assembleRelease
   ```
   After completion, the build will be located in 'android/app/build/outputs/apk/release/app-release.apk'
   

## Code Structure
Below are the important elements of the file structure for the application. For detailed descriptions on each file, view code_review directory in the docs folder.
```
beemon_bluetooth_project
│   README.md
│   App.tsx
|   registered_devices.tsx
│
└───src
│   └───bluetooth
│       │   app_permissions.tsx
│       │   appmaisCheck.tsx
│       │   BLEManagerSingleton.ts
|   └───components
|       |   CustomHeader.tsx
|       |   Line_graph.tsx
|       |   SideMenu.tsx
│   └───modals
|       |   AppTimingModal.tsx
|       |   ConnectingModal.tsx
|       |   LoadingModal.tsx
|       |   NanModal.tsx
|       |   ScanningModal.tsx
│   └───views
|       └───navigation
|       |       |   VarScreen.tsx
|       └───tabs
|       |       |   audio_tab.tsx
|       |       |   commands.tsx
|       |       |   modifications.tsx
|       |       |   sensors.tsx
|       |       |   video_tab.tsx
|       |   DeviceDetailsScreen.tsx
|       |   DeviceListScreen.tsx
|       |   PasswordScreen.tsx
 
```

## Extending the Application
### 1. Adding a new sensor
- Add characteristic for new sensor in GATT server.
- Det_FileRead:
   - Add characteristic UUID for new sensor at top of file.
   - In function Det_GraphData, add else if for new specific sensor.
- DeviceDetailsScreen.tsx:
   - Update get_graph_data() with new sensor.
   - 

### 2. Changing Password
The password is currently stored in a .txt file in the GATT_Server directory on the Raspberry Pi. In order to change this password, you need to just go into this file and change the password.

However, you will probably also want to change the path of where this file is located. Once you change the path, you will need to update the characteristic on the GATT server so that it can find the file. Do this through the steps below:
- Go to the file "BLEAppServiceAndAdvertisement.py"
- On line 82 within the  __init_ function you will see the following line of code:
  ```
  self.add_characteristic(PasswordVerificationCharacteristic(self, '00000601-710e-4a5b-8d75-3e5b444bc3cf', '/home/bee/GATT_server/password.txt'))
  ```
- As you can see the third parameter here is the path to the file containing the current password. Just change this path to the new password location.



