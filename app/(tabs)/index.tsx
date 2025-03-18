import { Text, View, StyleSheet } from "react-native"
import useScanner from "@/hooks/useScanner"

export default function HomeScreen() {
	const { scanActionData } = useScanner()

	return (
		<View style={styles.container}>
			<Text style={styles.text}>Press scan button</Text>
			<Text style={styles.text}>Result: {scanActionData?.value}</Text>
			<Text style={styles.text}>Type: {scanActionData?.type}</Text>
			<Text style={styles.text}>Key: {scanActionData?.key}</Text>
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
