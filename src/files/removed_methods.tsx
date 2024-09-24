// PasswordScreen.tsx:

/*useEffect(() => {
    // connectWithRetry(MAX_RETRIES);
  }, []);*/

/*const connect = async () => {
    try {
      if (deviceId) {
        const device = await manager.connectToDevice(deviceId, { autoConnect: true });
        console.log('Connected to device:', device.name);

        // Discover all services and characteristics
        const discoveredDevice = await manager.discoverAllServicesAndCharacteristicsForDevice(device.id);
        // console.log('Discovered services and characteristics:', discoveredDevice);
        
        const discoveredServices = await discoveredDevice.services();
        discoveredServices.forEach(service => {
          console.log(`Service UUID: ${service.uuid}`);
        });

        return true;
      }
    } catch (error) {
      // console.error('Error connecting to device: ', error);
      return false;
    }
  };*/

// Function to retry connection a specified number of times
  /*const connectWithRetry = async (retries: number) => {
    for (let i = 0; i < retries; i++) {
      const connected = await connect();
      if (connected) return;
      console.log(`Retrying connection (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
    }
    Alert.alert("Connection Failed", "Unable to connect to the device after multiple attempts.");
  };*/