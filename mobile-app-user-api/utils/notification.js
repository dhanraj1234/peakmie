// const PushNotification = require('push-notification');
// // const DeviceType = PushNotification.DeviceType;
 
// const pn = PushNotification({
//     apn: {
//         cert: path.resolve('./cert/cert.pem'),
//         key: path.resolve('./cert/key.pem'),
//         production: false,
//     },
//     gcm: {
//         apiKey: 'gcm-api-key'
//     }
// });
 
// const data = {
//     title: 'Title',
//     message: 'Message',
//     badge: '',
//     sound: '',
//     payload: {
//         param1: 'additional data',
//         param2: 'another data'
//     }
// };
 
// pn.pushToAPN('ios-device-token', data); // push to single ios device
// // pn.pushToAPN(['token1', 'token2', 'token3'], data); // push to multiple ios devices
 
// // pn.push('device-token', data, DeviceType.IOS); // push to single ios device
// // pn.push(['token1', 'token2', 'token3'], data, DeviceType.IOS); // push to multiple ios devices
 
// pn.pushToGCM('android-device-token', data); // push to single android device
// // pn.pushToGCM(['token1', 'token2', 'token3'], data); // push to multiple android devices
 
// // pn.push('device-token', data, DeviceType.ANDROID); // push to single android device
// // pn.push(['token1', 'token2', 'token3'], data, DeviceType.ANDROID); // push to multiple android devices
// const devices = [
//     { token: 'token1', type: DeviceType.IOS },
//     { token: 'token2', type: DeviceType.ANDROID }
// ];

// // // send notification to all devices
// // Promise.all(devices.map(device => pn.push(device.token, data, device.type)));

// // or this might be more performant 
// const iosTokens = devices.filter(d => d.type === DeviceType.IOS).map(d => d.token);
// const andTokens = devices.filter(d => d.type === DeviceType.ANDROID).map(d => d.token);
// Promise.all([
//     iosTokens.length ? pn.push(iosTokens, data, DeviceType.IOS) : Promise.resolve(),
//     andTokens.length ? pn.push(andTokens, data, DeviceType.ANDROID) : Promise.resolve()
// ]);