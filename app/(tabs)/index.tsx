import { Text } from "react-native";
import "@/global.css";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="text-xl font-sans-bold text-primary">Welcome</Text>
      <Text className="text-xl font-sans-semibold text-primary">to</Text>
      <Text className="text-xl font-sans-extrabold text-primary">React</Text>
      <Text className="text-xl font-sans-medium text-primary">Native</Text>
      <Text className="text-xl font-sans-light text-primary">Hello</Text>
      <Text className="text-xl font-sans text-primary">World</Text>
    </SafeAreaView>
  );
}
