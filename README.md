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

### Steps

1. **Clone the repository:**
   

## Code Structure
Below are the important elements of the file structure for the application. For detailed descriptions on each file, view code_structure.md in the docs folder.
```
beemon_bluetooth_project
│   README.md
│   App.tsx   
│
└───src
│   └───files
│       │   BLEManagerSingleton.ts
│       │   appmaisCheck.tsx
│       │   devices.tsx
│   └───modals
|       |   CustomHeader.tsx
|       |   ScanningModal.tsx
|       |   StatusModal.tsx
|       |   connectingModal.tsx
│   └───views
|       └───navigation
|       |       |   AudVidScreen.tsx
|       |       |   VarScreen.tsx
|       └───tabs
|       |       |   audio_tab.tsx
|       |       |   commands.tsx
|       |       |   data.tsx
|       |       |   modifications.tsx
|       |       |   sensors.tsx
|       |       |   video_tab.tsx
|       |   DeviceDetailsScreen.tsx
|       |   DeviceListScreen.tsx
|       |   PasswordScreen.tsx
│   
└───docs
    │   
```

