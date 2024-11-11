/**
   * This method gets the file data from the sensor files using the GATT server.
   * It is responsible for getting the data points for the graph and for the info modal.
   * 
   */
  /*const get_graph_data = async () => {
    // Resets offset for the file within the GATT server, makes sure we start reading from the first line of the file.
    await resetOffset();

    // Create variables to hold data, labels, and nan readings for each sensor
    let cpu_graph_labels: string[] = [];  // Array to hold labels for graph creation (No nan values)
    let cpu_graph_values: number[] = [];  // Array to hold corresponding values for graph creation (No nan values)
    let cpu_all_labels: string[] = [];  // Array to hold all labels (including points where the value was nan)
    let cpu_all_values: string[] = [];  // Array to hold all values (including nan values)
    let cpu_nanCount = 0;   // Holds nan count
    let cpu_failure_count = 0;  // Holds the failure count
    let cpu_interpolated_indeces: number[] = [];  // Array to hold indeces of interpolated values

    let humidity_graph_labels: string[] = [];
    let humidity_graph_values: number[] = [];
    let humidity_all_labels: string[] = [];
    let humidity_all_values: string[] = []
    let humidity_nanCount = 0;
    let hum_failure_count = 0;
    let hum_interpolated_indeces: number[] = [];

    let temperature_graph_labels: string[] = [];
    let temperature_graph_values: number[] = [];
    let temperature_all_labels: string[] = [];
    let temperature_all_values: string[] = [];
    let temperature_nanCount = 0;
    let temp_failure_count = 0;
    let temp_interpolated_indeces: number[] = [];

    // Values below are related to data interpolation
    let cpu_saved_nan_occurences: string[] = [];  // Saves the labels of nan occurences in the file
    let cpu_nan_occurence_count = 0;  // Number of nan occurences in a row so far. Used to detect failures

    let hum_saved_nan_occurences: string[] = [];
    let hum_nan_occurence_count = 0;

    let temp_saved_nan_occurences: string[] = [];
    let temp_nan_occurence_count = 0;


    let cpu_line_data, ht_line_data = null; // Variables to hold the current cpu and ht line data
    const cpu_data = await Det_FileRead(deviceId, "cpu"); // Call Det_FileRead to get cpu file data

    // Loop through each line of data returned from the file.
    for (let i = 0; i < cpu_data.length; i++) {
      cpu_line_data = cpu_data[i];  // Gets next line of data to process

      const cpu_line_pieces = cpu_line_data.split(',');   // cpu lines formatted like this: ""14-10-00",97.3,80.0".
      const cpu_label = cpu_line_pieces[0];
      const cpu_value = cpu_line_pieces[1];

      // Call method to process this line of data
      const result = await handle_graph_value(cpu_label, cpu_value, cpu_graph_labels, cpu_graph_values, cpu_all_labels, cpu_all_values, cpu_nanCount, cpu_nan_occurence_count, cpu_failure_count, cpu_saved_nan_occurences, cpu_interpolated_indeces);
      // Save data from result fro graph and modal related data
      cpu_graph_labels = result[0];
      cpu_graph_values = result[1];
      cpu_all_labels = result[2];
      cpu_all_values = result[3];
      cpu_nanCount = result[4];
      cpu_failure_count = result[6];
      cpu_interpolated_indeces = result[8];
      // Saved data from result for data relating to interpolating values.
      cpu_nan_occurence_count = result[5];
      cpu_saved_nan_occurences = result[7];

      // If we are at the last returned line, if any values are left in the nan_occurences array, deal with them accordingly
      if (i == cpu_data.length - 1) {
        // If we have 3 or more, we have another failure.
        if (cpu_saved_nan_occurences.length >= 3) {
            cpu_failure_count++;
        }

        // Add labels and values for each nan occurence to the overall labels and values arrays.
        for (let t = 0; t < cpu_saved_nan_occurences.length; t++) {
          cpu_all_labels.push(cpu_saved_nan_occurences[t]);
          cpu_all_values.push("nan");
        }

        cpu_saved_nan_occurences = [];
        cpu_nan_occurence_count = 0;
      }
    }

    const ht_data = await Det_FileRead(deviceId, "ht"); // Call Det_FileRead to get Humidity and Temperature data from file

    // Loop through each line from file
    for (let i = 0; i < ht_data.length; i++) {
      ht_line_data = ht_data[i];  // Gets next line of data to process

      // Lines in this file formatted like this: ""14-00-00", 87, 53"
      const ht_line_pieces = ht_line_data.split(',');
      const time = ht_line_pieces[0];
      const temperature = ht_line_pieces[1];
      const humidity = ht_line_pieces[2];

      // Processes line of humidity data.
      const hum_result = await handle_graph_value(time, humidity, humidity_graph_labels, humidity_graph_values, humidity_all_labels, humidity_all_values, humidity_nanCount, hum_nan_occurence_count, hum_failure_count, hum_saved_nan_occurences, hum_interpolated_indeces);
      // Save data from hum_result for graph and modal creation
      humidity_graph_labels = hum_result[0];
      humidity_graph_values = hum_result[1];
      humidity_all_labels = hum_result[2];
      humidity_all_values = hum_result[3];
      humidity_nanCount = hum_result[4];
      hum_failure_count = hum_result[6];
      hum_interpolated_indeces = hum_result[8];
      // Save data from hum_result for dealing with interpolated data
      hum_nan_occurence_count = hum_result[5];
      hum_saved_nan_occurences = hum_result[7];

      // Processes line of temperature data
      const temp_result = await handle_graph_value(time, temperature, temperature_graph_labels, temperature_graph_values, temperature_all_labels, temperature_all_values, temperature_nanCount, temp_nan_occurence_count, temp_failure_count, temp_saved_nan_occurences, temp_interpolated_indeces);
      
      // Save data from temp_result for graph and modal creation
      temperature_graph_labels = temp_result[0];
      temperature_graph_values = temp_result[1];
      temperature_all_labels = temp_result[2];
      temperature_all_values = temp_result[3];
      temperature_nanCount = temp_result[4];
      temp_failure_count = temp_result[6];
      temp_interpolated_indeces = temp_result[8];
      // Save data from hum_result for dealing with interpolated data
      temp_nan_occurence_count = temp_result[5];
      temp_saved_nan_occurences = temp_result[7];

      // If we are on the final line of data, if any values are left in the nan_occurences array, deal with them accordingly
      if (i == ht_data.length - 1) {
        if (hum_saved_nan_occurences.length > 0) {
          // If there are 3 or more, increment the failure count
          if (hum_saved_nan_occurences.length >= 3) {
            hum_failure_count++;
          }

          // Add these values to the overall data arrays 
          for (let t = 0; t < hum_saved_nan_occurences.length; t++) {
            humidity_all_labels.push(hum_saved_nan_occurences[t]);
            humidity_all_values.push("nan");
          }
          hum_saved_nan_occurences = []
        }

        if (temp_saved_nan_occurences.length > 0) {
          // If there are 3 or more, increment the failure count
          if (temp_saved_nan_occurences.length >= 3) {
            temp_failure_count++;
          }

          // Add these values to the overall data arrays
          for (let t = 0; t < temp_saved_nan_occurences.length; t++) {
            temperature_all_labels.push(temp_saved_nan_occurences[t]);
            temperature_all_values.push("nan");
          }
        }
      }
    }

    // TODO: Check if charts are empty, if so do something
    console.log("Values: ", cpu_graph_values)

    // Set cpu chart and overall data
    if (cpu_graph_values.length > 0) {
      setCpuData(prevCpuData => ({
        ...prevCpuData,
        chartData: { labels: cpu_graph_labels, datasets: [{ data: cpu_graph_values, strokeWidth: 2 }] },
        allTimes: cpu_all_labels,
        allValues: cpu_all_values,
        interpolatedIndeces: cpu_interpolated_indeces,
        nanCount: cpu_nanCount,
        failureCount: cpu_failure_count
      }));
    }

    // Set humidity chart and overall data
    if (humidity_graph_values.length > 0) {
      setHumidityData(prevHumData => ({
        ...prevHumData,
        chartData: { labels: humidity_graph_labels, datasets: [{ data: humidity_graph_values, strokeWidth: 2 }] },
        allTimes: humidity_all_labels,
        allValues: humidity_all_values,
        interpolatedIndeces: hum_interpolated_indeces,
        nanCount: humidity_nanCount,
        failureCount: hum_failure_count
      }))
    }

    // Set temperature chart and overall data
    if (temperature_graph_values.length > 0) {
      setTemperatureData(prevTempData => ({
        ...prevTempData,
        chartData: { labels: temperature_graph_labels, datasets: [{ data: temperature_graph_values, strokeWidth: 2 }] },
        allTimes: temperature_all_labels,
        allValues: temperature_all_values,
        interpolatedIndeces: temp_interpolated_indeces,
        nanCount: temperature_nanCount,
        failureCount: temp_failure_count
      }))
    }
  }*/
