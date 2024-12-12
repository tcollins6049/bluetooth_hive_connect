export const UUIDS = {
    SERVICE: "00000001-710e-4a5b-8d75-3e5b444bc3cf",    // Service UUID
    
    PW_CHAR: "00000601-710e-4a5b-8d75-3e5b444bc3cf",    // Password characteristic UUID
    
    CPU_LINE_CHAR: "00000301-710e-4a5b-8d75-3e5b444bc3cf",  // Characteristic to retrieve line of cpu data
    HUMIDITY_LINE_CHAR: '00000302-710e-4a5b-8d75-3e5b444bc3cf', // Characteristic to retrieve line of humidity + temperature data
    SCALE_LINE_CHAR: '00000308-710e-4a5b-8d75-3e5b444bc3cf',    // Characteristic to retrieve line of scale data
    CPU_SENSOR_CHAR: '00000002-710e-4a5b-8d75-3e5b444bc3cf',    // Characteristic to retreive cpu temp reading from sensor
    OFFSET_CHAR: '00000305-710e-4a5b-8d75-3e5b444bc3cf',    // Characteristic to reset offset of file read

    AUDIO_INFO_CHAR: "00000201-710e-4a5b-8d75-3e5b444bc3cf",   // Gets audio info such as file size, etc.
    
    COMMAND_CHAR: "00000501-710e-4a5b-8d75-3e5b444bc3cf",   // Used to write commands to Pi

    START_CHAR: '00000101-710e-4a5b-8d75-3e5b444bc3cf', // Char used to modify capture_window_start_time variable in config
    END_CHAR: '00000102-710e-4a5b-8d75-3e5b444bc3cf',   // Char used to modify capture_window_end_time variable in config
    DURATION_CHAR: '00000103-710e-4a5b-8d75-3e5b444bc3cf',  // Char used to modify capture_duration_seconds variable in config
    INTERVAL_CHAR: '00000104-710e-4a5b-8d75-3e5b444bc3cf',  // Char used to modify capture_interval_seconds variable in config
    VIDEO_START_CHAR: '00000105-710e-4a5b-8d75-3e5b444bc3cf',   // Char used to modify capture_window_start_time variable in config for camera
    VIDEO_END_CHAR: '00000106-710e-4a5b-8d75-3e5b444bc3cf', // Char used to modify capture_window_end_time variable in config for camera
    VIDEO_DURATION_CHAR: '00000107-710e-4a5b-8d75-3e5b444bc3cf',    // Char used to modify capture_duration_seconds variable in config for camera
    VIDEO_INTERVAL_CHAR: '00000108-710e-4a5b-8d75-3e5b444bc3cf',    // Char used to modify capture_interval_seconds variable in config for camera

    MIC_CHAR: '00000401-710e-4a5b-8d75-3e5b444bc3cf',   // Char for microphone sensor state (on/off)
    CAMERA_CHAR: '00000402-710e-4a5b-8d75-3e5b444bc3cf',    // Char for camera sensor state (on/off)
    TEMP_CHAR: '00000403-710e-4a5b-8d75-3e5b444bc3cf',  // Char for temperature sensor state (on/off)
    AIRQUALITY_CHAR: '00000404-710e-4a5b-8d75-3e5b444bc3cf',    // Char for airquality sensor state (on/off)
    SCALE_CHAR: '00000405-710e-4a5b-8d75-3e5b444bc3cf', // Char for scale sensor state (on/off)
    CPU_CHAR: '00000406-710e-4a5b-8d75-3e5b444bc3cf',   // Char for CPU sensor state (on/off)

    CPU_FULL_FILE_CHAR: '00000211-710e-4a5b-8d75-3e5b444bc3cf', // Char for reading full cpu sensor file
    HT_FULL_FILE_CHAR: '00000212-710e-4a5b-8d75-3e5b444bc3cf',  // Char for reading full humidity/temperature sensor file
    SCALE_FULL_FILE_CHAR: '00000213-710e-4a5b-8d75-3e5b444bc3cf',   // Char for reading full scale sensor file

    VIDEO_FILE_INFO_CHAR: '00000202-710e-4a5b-8d75-3e5b444bc3cf',   // Char for readings basic info on most recent video recording on Pi (file size, etc.)
    FRAME_CHAR: '00000203-710e-4a5b-8d75-3e5b444bc3cf', // Char for getting frame from recording on Pi.
    STATIC_READ_CHAR: '00000207-710e-4a5b-8d75-3e5b444bc3cf',   // Char for retrieving a file from Pi
    VIDEO_LINE_CHAR: '00000209-710e-4a5b-8d75-3e5b444bc3cf',    // Char for getting line of data from file on Pi containing file sizes of recordings for the day.
}

export const PATHS = {

}