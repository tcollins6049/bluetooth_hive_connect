# React Native Application

## Overview

This React Native application connects to a Raspberry Pi GATT server to monitor and manage various data points from a beehive. The application allows users to input a password, verify it with the server, and then access real-time data from the beehive, including temperature and humidity readings. The application is written in TypeScript and uses various libraries for charts and BLE communication.

## Features

- **BLE Communication:** Connects to a Raspberry Pi GATT server.
- **Password Verification:** Securely sends and verifies a password with the pi.
- **Real-Time Data Monitoring:** Displays sensor data.
- **Chart Visualization:** Line graph representation of data, including handling of gaps (NaN values).
- **Security:** Only allows access after successful password verification.

## Installation

### Prerequisites

- Node.js
- npm or yarn
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/yourprojectname.git
   cd yourprojectname


