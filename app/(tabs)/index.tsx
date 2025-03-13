import { useEffect, useState } from "react"
import {
	Text,
	View,
	StyleSheet,
	type EmitterSubscription,
	NativeEventEmitter,
	Platform,
} from "react-native"

import Urovo, {
	closeScanner,
	openScanner,
	UROVO_EVENTS,
	type ScanResult,
} from "react-native-urovo"

import { useKeyEvent } from "@/hooks/useKeyEvent"

export default function HomeScreen() {
	const { keyEvent } = useKeyEvent()

	const [scanResult, setScanResult] = useState<ScanResult>()
	const [isScannerOpened, setIsScannerOpened] = useState<boolean>(false)

	useEffect(() => {
		let isMounted = true

		const open = async () => {
			const isOpened = await openScanner()

			if (isMounted) {
				setIsScannerOpened(!!isOpened)
			}
		}

		open()

		return () => {
			isMounted = false
			closeScanner()
		}
	}, [])

	useEffect(() => {
		let eventListener: EmitterSubscription | undefined

		if (isScannerOpened && Urovo) {
			const eventEmitter =
				Platform.OS === "android"
					? new NativeEventEmitter()
					: new NativeEventEmitter(Urovo)

			if (!eventListener)
				eventListener = eventEmitter.addListener(
					UROVO_EVENTS.ON_SCAN,
					(scan: ScanResult) => {
						console.log("Scan result:", scan)

						setScanResult(scan)
					}
				)
		}

		return () => {
			eventListener?.remove()
		}
	}, [isScannerOpened])

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Result: {scanResult?.value}</Text>
			<Text style={styles.text}>Type: {scanResult?.type}</Text>
			<Text style={styles.text}>Key: {keyEvent?.key}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		fontSize: 20,
		textAlign: "center",
	},
})
