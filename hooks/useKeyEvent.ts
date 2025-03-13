import { useEvent } from "expo"
import { useEffect, useMemo } from "react"

import ExpoKeyEventModule from "expo-key-event/src/ExpoKeyEventModule"

/**
 *
 * @param listenOnMount Pass 'false' to prevent automatic key event listening
 * - Use startListening/stopListening to control the listener manually
 * @returns
 *
 */
export function useKeyEvent(listenOnMount = true) {
	const event = useEvent(ExpoKeyEventModule, "onKeyPress")

	useEffect(() => {
		if (listenOnMount) ExpoKeyEventModule.startListening()

		return () => {
			ExpoKeyEventModule.stopListening()
		}
	}, [listenOnMount])

	const keyEvent = useMemo(() => {
		if (!event) return null
		return {
			key: event.key,
		}
	}, [event])

	return {
		/**
		 * Start listening for key events
		 */
		startListening: () => ExpoKeyEventModule.startListening(),
		/**
		 * Stop listening for key events
		 */
		stopListening: () => ExpoKeyEventModule.stopListening(),
		keyEvent,
	}
}
