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


