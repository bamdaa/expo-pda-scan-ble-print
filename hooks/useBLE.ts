/* eslint-disable no-bitwise */
import { useMemo, useState } from "react"
import { PermissionsAndroid, Platform } from "react-native"
import {
	BleError,
	BleManager,
	Characteristic,
	Device,
} from "react-native-ble-plx"

import * as ExpoDevice from "expo-device"

let Buffer = require("buffer/").Buffer

const SERVICE_UUID = "49535343-fe7d-4ae5-8fa9-9fafd205e455"
const CHARACTERISTIC_UUID = "49535343-8841-43f4-a8d4-ecbe34729bb3"

interface BluetoothLowEnergyApi {
	requestPermissions(): Promise<boolean>
	scanForPeripherals(): void
	connectToDevice: (deviceId: Device) => Promise<void>
	disconnectFromDevice: () => void
	connectedDevice: Device | null
	allDevices: Device[]
	heartRate: number
}

function useBLE(): BluetoothLowEnergyApi {
	const bleManager = useMemo(() => new BleManager(), [])
	const [allDevices, setAllDevices] = useState<Device[]>([])
	const [connectedDevice, setConnectedDevice] = useState<Device | null>(null)
	const [heartRate, setHeartRate] = useState<number>(0)

	const requestAndroid31Permissions = async () => {
		const bluetoothScanPermission = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
			{
				title: "Location Permission",
				message: "Bluetooth Low Energy requires Location",
				buttonPositive: "OK",
			}
		)
		const bluetoothConnectPermission = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
			{
				title: "Location Permission",
				message: "Bluetooth Low Energy requires Location",
				buttonPositive: "OK",
			}
		)
		const fineLocationPermission = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
			{
				title: "Location Permission",
				message: "Bluetooth Low Energy requires Location",
				buttonPositive: "OK",
			}
		)

		return (
			bluetoothScanPermission === PermissionsAndroid.RESULTS.GRANTED &&
			bluetoothConnectPermission === PermissionsAndroid.RESULTS.GRANTED &&
			fineLocationPermission === PermissionsAndroid.RESULTS.GRANTED
		)
	}

	const requestPermissions = async () => {
		if (Platform.OS === "android") {
			if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
				const granted = await PermissionsAndroid.request(
					PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
					{
						title: "Location Permission",
						message: "Bluetooth Low Energy requires Location",
						buttonPositive: "OK",
					}
				)
				return granted === PermissionsAndroid.RESULTS.GRANTED
			} else {
				const isAndroid31PermissionsGranted =
					await requestAndroid31Permissions()

				return isAndroid31PermissionsGranted
			}
		} else {
			return true
		}
	}

	const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
		devices.findIndex((device) => nextDevice.id === device.id) > -1

	const scanForPeripherals = () =>
		bleManager.startDeviceScan(null, null, (error, device) => {
			if (error) {
				console.log(error)
			}
			if (device && device.name?.includes("HM-")) {
				setAllDevices((prevState: Device[]) => {
					if (!isDuplicteDevice(prevState, device)) {
						return [...prevState, device]
					}
					return prevState
				})
			}
		})

	const connectToDevice = async (device: Device) => {
		try {
			const deviceConnection = await bleManager.connectToDevice(device.id)
			setConnectedDevice(deviceConnection)
			await deviceConnection.discoverAllServicesAndCharacteristics()

			bleManager.stopDeviceScan()
			await printData(deviceConnection)
		} catch (e) {
			console.log("FAILED TO CONNECT", e)
		}
	}

	const disconnectFromDevice = () => {
		if (connectedDevice) {
			bleManager.cancelDeviceConnection(connectedDevice.id)
			console.log("Disconnected", Date.now())
			setConnectedDevice(null)
		}
	}

	const printData = async (device: Device) => {
		if (device) {
			const isConnected = await device.isConnected()

			if (!isConnected) {
				console.log("Device not connected!")
				return
			}

			console.log(device.id, "is connected!")

			const printLines = [
				`! 0 200 200 400 1`,
				`BOX 10 10 590 380 2`,
				`B QR 300 70 M 2 U 12`,
				`MA,BamDaa-0515`,
				`ENDQR`,
				`COUNTRY USA`,
				`TEXT 1 1 300 30 BamDaa`,
				`LEFT`,
				`TEXT 1 5 30 30 515`,
				`LEFT`,
				`TEXT 1 4 30 320 4/HiCargo`,
				`LEFT`,
				`TEXT 1 1 30 90 John Doe`,
				`TEXT 1 4 30 120 88668800`,
				`TEXT 1 0 30 195 Total`,
				`TEXT 1 3 85 185 0.5m3`,
				`CENTER 150`,
				`TEXT 1 4 0 250 Price:150`,
				`RIGHT 380`,
				`TEXT 1 0 0 345 2025/03/17 17:35`,
				`FORM`,
				`PRINT`,
			]

			try {
				const printData = generatePrintData(printLines.join("\n"))

				await sendInChunks(device, SERVICE_UUID, CHARACTERISTIC_UUID, printData)
			} catch (error) {
				console.log(error)
			}
		} else {
			console.log("No Device Connected")
		}
	}

	const generatePrintData = (text: string): string => {
		const initializer: number[] = [0x1b, 0x40]
		const centerAlign: number[] = [0x1b, 0x61, 0x01]
		const doubleSize: number[] = [0x1d, 0x21, 0x11]
		const lineFeed: number[] = [0x0a, 0x0a, 0x0a]
		const cutPaper: number[] = [0x1d, 0x56, 0x41, 0x10]

		const commands: number[] = [
			...initializer,
			...centerAlign,
			...doubleSize,
			...(Array.from(Buffer.from(text, "utf8")) as number[]),
			...lineFeed,
			...cutPaper,
		]

		return Buffer.from(new Uint8Array(commands)).toString("base64")
	}

	const sendInChunks = async (
		device: any,
		serviceUUID: string,
		characteristicUUID: string,
		data: string,
		chunkSize: number = 20
	) => {
		const buffer = Buffer.from(data, "base64")
		for (let i = 0; i < buffer.length; i += chunkSize) {
			const chunk = buffer.slice(i, i + chunkSize).toString("base64")

			// console.log(`Sending chunk: ${chunk}`)

			await device.writeCharacteristicWithoutResponseForService(
				serviceUUID,
				characteristicUUID,
				chunk
			)
			await new Promise((resolve) => setTimeout(resolve, 50))
		}
	}

	return {
		scanForPeripherals,
		requestPermissions,
		connectToDevice,
		allDevices,
		connectedDevice,
		disconnectFromDevice,
		heartRate,
	}
}

export default useBLE
