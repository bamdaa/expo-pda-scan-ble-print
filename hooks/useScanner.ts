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
	const [scanActionData, setScanActionData] = useState<any>()

	useEffect(() => {
		let isMounted = true
		let eventListener: EmitterSubscription | undefined

		const initializeScanner = async () => {
			const isOpened = await openScanner()

			if (isOpened && Urovo) {
				const eventEmitter =
					Platform.OS === "android"
						? new NativeEventEmitter()
						: new NativeEventEmitter(Urovo)

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
			isMounted = false
			eventListener?.remove()
			closeScanner()
		}
	}, [])

	useEffect(() => {
		console.log("\n\n")
		const actionData = { ...scanResult, ...keyEvent }
		setScanActionData(actionData)
		console.log("Scan action data:", actionData)
		console.log("\n\n")
	}, [scanResult])

	return { scanResult, keyEvent, scanActionData }
}

export default useScanner
