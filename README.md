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
### Organization
```
project
│   README.md
│   file001.txt    
│
└───folder1
│   │   file011.txt
│   │   file012.txt
│   │
│   └───subfolder1
│       │   file111.txt
│       │   file112.txt
│       │   ...
│   
└───folder2
    │   file021.txt
    │   file022.txt
```

