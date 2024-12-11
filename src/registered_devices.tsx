// Interface for devices. Each device is composed of a name and id
export interface DeviceInterface {
    id: string;
    name: string;
}

// List of registered devices.
const reg_devices: DeviceInterface[] = [
    { id: 'E4:5F:01:5F:AF:73', name: 'rpi4-60' },
    { id: 'D8:3A:DD:75:8C:25', name: 'rpi4-30' },
    // { id: 'E4:5F:01:5F:AF:73', name: 'rpi4-30' },
    { id: 'E4:5F:01:09:FB:06', name: 'rpi4-11' },
    { id: 'E4:5F:01:5F:AE:E0', name: '6RC' },
    { id: 'E4:5F:01:09:FC:95', name: '6L' }
    // Add more devices as needed
];


export default reg_devices;
