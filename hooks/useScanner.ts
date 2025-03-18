import { useEffect, useState } from "react"

// import Urovo, {
// 	closeScanner,
// 	openScanner,
// 	UROVO_EVENTS,
// 	type ScanResult,
// } from "react-native-urovo"

const Urovo = require("react-native-urovo").default
const {
	closeScanner,
	openScanner,
	UROVO_EVENTS,
} = require("react-native-urovo")

type ScanResult = {
	type: number
	value: string
}

import { useKeyEvent } from "@/hooks/useKeyEvent"
import { EmitterSubscription, NativeEventEmitter, Platform } from "react-native"

const useScanner = () => {
	const { keyEvent } = useKeyEvent()
	const [scanResult, setScanResult] = useState<ScanResult>()
	const [scanActionData, setScanActionData] = useState<
		ScanResult & { key: string }
	>()

	useEffect(() => {
		let eventListener: EmitterSubscription | undefined

		const initializeScanner = async () => {
			const isOpened = await openScanner()

			if (isOpened && Urovo) {
				const eventEmitter =
					Platform.OS === "android"
						? new NativeEventEmitter(Urovo)
						: new NativeEventEmitter()

				if (!eventListener)
					eventListener = eventEmitter.addListener(
						UROVO_EVENTS.ON_SCAN,
						(scan: ScanResult) => {
							setScanResult(scan)
						}
					)
			}
		}

		initializeScanner()

		return () => {
			eventListener?.remove()
			closeScanner()
		}
	}, [])

	useEffect(() => {
		if (scanResult && keyEvent) {
			const actionData = { ...scanResult, ...keyEvent }
			setScanActionData(actionData)
			console.log("Scan Action Data:", actionData)
		}
	}, [scanResult])

	return { scanResult, keyEvent, scanActionData }
}

export default useScanner
